# استخدام صورة Python رسمية كقاعدة
FROM python:3.11-slim

# تعيين متغيرات البيئة لمنع Python من كتابة ملفات .pyc وتعطيل التخزين المؤقت للمخرجات
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# تعيين مجلد العمل داخل الحاوية
WORKDIR /app

# تثبيت تبعات النظام اللازمة (إذا لزم الأمر)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# نسخ ملف المتطلبات وتثبيت التبعات
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# نسخ بقية ملفات المشروع إلى مجلد العمل
COPY . .

# تعريض المنفذ الذي يعمل عليه التطبيق
EXPOSE 5000

# أمر تشغيل التطبيق باستخدام uvicorn
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "5000"]
