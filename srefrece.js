(function () {
    'use strict';

    const SHEET2_URL = "https://script.google.com/macros/s/AKfycbz8VsBQhJCIS0ESQHj_4X7ox_OcmkPz95Stlq5tUVqFm6IZZEJwp-dtYO8s5h223WU_/exec";
    let isChecking = false;

    function checkAndRefresh() {
        if (isChecking) return;
        isChecking = true;

        const fetchUrl = SHEET2_URL + (SHEET2_URL.includes('?') ? '&' : '?') + 't=' + Date.now();

        GM_xmlhttpRequest({
            method: "GET",
            url: fetchUrl,
            headers: {
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache"
            },
            onload: function (res) {
                isChecking = false;
                try {
                    const data = JSON.parse(res.responseText);
                    const refreshStatus = String(data.refresh || data.REFRESH || '').trim().toUpperCase();

                    const lastStatus = sessionStorage.getItem('script_last_known_status');
                    sessionStorage.setItem('script_last_known_status', refreshStatus);

                    // ১. OFF থেকে ON হলে পুরনো সব টাইমার ভেঙে নতুন করে শুরু হবে
                    if (lastStatus === 'OFF' && refreshStatus === 'ON') {
                        sessionStorage.removeItem('script_last_refresh_batch');
                        sessionStorage.removeItem('script_refresh_count');
                    }

                    // ২. ৩ মিনিটের বিরতি চেক
                    const lastBatchTime = sessionStorage.getItem('script_last_refresh_batch');
                    if (lastBatchTime && (Date.now() - parseInt(lastBatchTime, 10) < 180000)) {
                        return;
                    }

                    if (refreshStatus === 'ON') {
                        let refreshCount = parseInt(sessionStorage.getItem('script_refresh_count') || '0', 10);

                        if (refreshCount < 4) {
                            sessionStorage.setItem('script_refresh_count', refreshCount + 1);

                            if (refreshCount + 1 >= 4) {
                                sessionStorage.setItem('script_last_refresh_batch', Date.now().toString());
                                sessionStorage.removeItem('script_refresh_count');
                            }

                            // হার্ড রিফ্রেশ
                            window.location.href = window.location.href.split('#')[0];
                            window.location.reload(true);
                        }
                    } else {
                        // OFF থাকলে সবকিছু ক্লিয়ার
                        sessionStorage.removeItem('script_refresh_count');
                        sessionStorage.removeItem('script_last_refresh_batch');
                    }
                } catch (e) {
                    console.warn("Refresh config parse error");
                }
            },
            onerror: function () {
                isChecking = false;
            }
        });
    }

    checkAndRefresh();
    setInterval(checkAndRefresh, 2000);

})();
