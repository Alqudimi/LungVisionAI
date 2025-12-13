document.addEventListener('DOMContentLoaded', () => {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const previewSection = document.getElementById('previewSection');
    const previewImage = document.getElementById('previewImage');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const clearBtn = document.getElementById('clearBtn');
    const resultsSection = document.getElementById('resultsSection');
    const newAnalysisBtn = document.getElementById('newAnalysisBtn');

    let selectedFile = null;

    uploadArea.addEventListener('click', () => fileInput.click());

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    function handleFile(file) {
        if (!file.type.startsWith('image/')) {
            showError('يرجى اختيار ملف صورة صالح');
            return;
        }

        selectedFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImage.src = e.target.result;
            uploadArea.style.display = 'none';
            previewSection.style.display = 'block';
            resultsSection.style.display = 'none';
        };
        reader.readAsDataURL(file);
    }

    clearBtn.addEventListener('click', () => {
        resetUpload();
    });

    newAnalysisBtn.addEventListener('click', () => {
        resetUpload();
    });

    function resetUpload() {
        selectedFile = null;
        fileInput.value = '';
        previewImage.src = '';
        uploadArea.style.display = 'block';
        previewSection.style.display = 'none';
        resultsSection.style.display = 'none';
    }

    analyzeBtn.addEventListener('click', async () => {
        if (!selectedFile) return;

        const btnText = analyzeBtn.querySelector('.btn-text');
        const spinner = analyzeBtn.querySelector('.spinner');
        
        btnText.textContent = 'جاري التحليل...';
        spinner.style.display = 'block';
        analyzeBtn.disabled = true;

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const response = await fetch('/predict', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                displayResults(data);
            } else {
                showError(data.detail || 'حدث خطأ أثناء التحليل');
            }
        } catch (error) {
            showError('فشل الاتصال بالخادم. يرجى المحاولة مرة أخرى.');
            console.error('Error:', error);
        } finally {
            btnText.textContent = 'تحليل الصورة';
            spinner.style.display = 'none';
            analyzeBtn.disabled = false;
        }
    });

    function displayResults(data) {
        const resultIcon = document.getElementById('resultIcon');
        const resultTitle = document.getElementById('resultTitle');
        const confidenceBar = document.getElementById('confidenceBar');
        const confidenceValue = document.getElementById('confidenceValue');
        const pneumoniaProb = document.getElementById('pneumoniaProb');
        const normalProb = document.getElementById('normalProb');
        const diagnosisBox = document.getElementById('diagnosisBox');
        const diagnosisText = document.getElementById('diagnosisText');
        const recommendationText = document.getElementById('recommendationText');

        const isNormal = data.result === 'NORMAL';

        resultIcon.className = 'result-icon ' + (isNormal ? 'success' : 'danger');
        resultIcon.innerHTML = isNormal ? '✓' : '!';

        resultTitle.className = 'result-title ' + (isNormal ? 'success' : 'danger');
        resultTitle.textContent = isNormal ? 'سليم - لا يوجد التهاب رئوي' : 'تم اكتشاف التهاب رئوي';

        confidenceBar.className = 'confidence-bar ' + (isNormal ? 'success' : 'danger');
        confidenceBar.style.width = '0%';
        setTimeout(() => {
            confidenceBar.style.width = data.confidence + '%';
        }, 100);

        confidenceValue.textContent = data.confidence + '%';

        pneumoniaProb.textContent = data.details.pneumonia_probability + '%';
        normalProb.textContent = data.details.normal_probability + '%';

        diagnosisBox.className = 'diagnosis-box ' + (isNormal ? 'success' : 'danger');
        diagnosisText.textContent = isNormal ? 
            'التحليل يشير إلى أن الرئتين سليمتان ولا توجد علامات على الالتهاب الرئوي' : 
            'التحليل يشير إلى وجود علامات تدل على الالتهاب الرئوي';

        recommendationText.textContent = data.details.recommendation;

        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function showError(message) {
        alert(message);
    }
});
