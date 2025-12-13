from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
from PIL import Image
import io
import tensorflow as tf

app = FastAPI(title="X-Ray Pneumonia Detection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = "model/Xray_model.keras"
IMG_SIZE = (300, 300)

model = None

def load_model():
    global model
    if model is None:
        print("Loading model...")
        model = tf.keras.models.load_model(MODEL_PATH)
        print("Model loaded successfully!")
    return model

def preprocess_image(image_bytes):
    image = Image.open(io.BytesIO(image_bytes))
    if image.mode != 'RGB':
        image = image.convert('RGB')
    image = image.resize(IMG_SIZE)
    img_array = np.array(image) / 255.0
    img_array = np.expand_dims(img_array, axis=0)
    return img_array

@app.on_event("startup")
async def startup_event():
    load_model()

@app.get("/")
async def read_root():
    return FileResponse("static/index.html")

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="يجب أن يكون الملف صورة")
    
    try:
        contents = await file.read()
        
        if len(contents) == 0:
            raise HTTPException(status_code=400, detail="الملف فارغ")
        
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="حجم الملف كبير جداً (الحد الأقصى 10 ميجابايت)")
        
        img_array = preprocess_image(contents)
        
        model_instance = load_model()
        prediction = model_instance.predict(img_array, verbose=0)
        probability = float(prediction[0][0])
        
        if probability > 0.5:
            result = "PNEUMONIA"
            confidence = probability * 100
        else:
            result = "NORMAL"
            confidence = (1 - probability) * 100
        
        return JSONResponse({
            "success": True,
            "result": result,
            "confidence": round(confidence, 2),
            "probability": round(probability, 4),
            "details": {
                "pneumonia_probability": round(probability * 100, 2),
                "normal_probability": round((1 - probability) * 100, 2),
                "diagnosis": "Pneumonia detected" if result == "PNEUMONIA" else "No pneumonia detected",
                "recommendation": "Please consult a medical professional for proper diagnosis." if result == "PNEUMONIA" else "The X-ray appears normal, but please consult a doctor for confirmation."
            }
        })
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="حدث خطأ أثناء معالجة الصورة. تأكد من أن الملف صورة صالحة.")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "model_loaded": model is not None}

app.mount("/static", StaticFiles(directory="static"), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
