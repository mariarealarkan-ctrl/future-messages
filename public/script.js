// Frontend Script - آمن تماماً (بدون مفاتيح API)
document.addEventListener('DOMContentLoaded', () => {
  const futureForm = document.getElementById('futureForm');
  const submitBtn = document.getElementById('submitBtn');
  const messageDiv = document.getElementById('message');
  const loadingDiv = document.getElementById('loading');
  const errorDiv = document.getElementById('error');
  const payButton = document.getElementById('payButton');

  // معالج نموذج الإرسال
  futureForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const age = document.getElementById('age').value.trim();
    const country = document.getElementById('country').value.trim();

    // التحقق من صحة المدخلات
    if (!name || !age || !country) {
      showError('يرجى ملء جميع الحقول');
      return;
    }

    if (age < 1 || age > 150) {
      showError('يرجى إدخال عمر صحيح');
      return;
    }

    // إخفاء جميع العناصر
    hideAll();
    loadingDiv.classList.remove('hidden');
    submitBtn.disabled = true;

    try {
      // استدعاء Backend API
      const response = await fetch('/api/generate-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, age, country })
      });

      if (!response.ok) {
        throw new Error(`خطأ في الخادم: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // عرض الرسالة
      hideAll();
      messageDiv.textContent = data.message;
      messageDiv.classList.remove('hidden');
      payButton.classList.remove('hidden');

    } catch (error) {
      hideAll();
      showError(error.message || 'حدث خطأ في توليد الرسالة. حاول مرة أخرى.');
    } finally {
      submitBtn.disabled = false;
    }
  });

  // معالج زر الدفع
  payButton.addEventListener('click', () => {
    // سيتم إعادة التوجيه من Backend مع معالجة آمنة
    window.location.href = '/api/paypal-redirect';
  });

  function hideAll() {
    messageDiv.classList.add('hidden');
    loadingDiv.classList.add('hidden');
    errorDiv.classList.add('hidden');
    payButton.classList.add('hidden');
  }

  function showError(message) {
    hideAll();
    errorDiv.textContent = '❌ ' + message;
    errorDiv.classList.remove('hidden');
  }
});