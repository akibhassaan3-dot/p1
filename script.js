(function () {
    'use strict';

    const CONFIG_URL = "https://script.google.com/macros/s/AKfycbxHRekZd6xqf8T9oKofFq2k61MEVm9ZyNXegmjlNHKfCaKccH3CjR2JxD4WAIx9YsVl/exec";
    const LOG_DATA_URL = "https://script.google.com/macros/s/AKfycbx2KKtbPMyfxXEFhEH06z-p2H7l64ZGPAT_nhk_KSo1Amc5xhwnK9FNPnzUze1I9eCA/exec";

    let CONFIG = {
        show_amount: null,
        submit_amount: null,
        uid: null,
        depot: null, // [FIXED] Depot key defined
        enable: 0
    };

    let configLoaded = false;
    let forceInterval = null;
    let isFetching = false;

    /* ---------- CONFIG LOAD ---------- */
    function loadRemoteConfig() {
        if (isFetching) return;
        isFetching = true;

        GM_xmlhttpRequest({
            method: "GET",
            url: CONFIG_URL,
            onload: function (res) {
                isFetching = false;

                try {
                    const data = JSON.parse(res.responseText);

                    CONFIG.show_amount = data.show_amount ? Number(data.show_amount).toFixed(2) : null;
                    CONFIG.submit_amount = data.submit_amount !== undefined ? Number(data.submit_amount).toFixed(2) : null;
                    CONFIG.uid = data.uid ? String(data.uid) : null;

                    // [FIXED 1] Google Sheet / Remote Config থেকে depot মান রিড করা
                    CONFIG.depot = data.depot ? String(data.depot) : null;

                    CONFIG.enable = Number(data.enable) || 0;

                    configLoaded = true;

                    if (CONFIG.enable === 1 && !forceInterval) startForce();
                    if (CONFIG.enable !== 1 && forceInterval) {
                        stopForce();
                        resetToOriginal();
                    }

                } catch (e) {
                    console.warn("Config parse error");
                }
            },
            onerror: function () {
                isFetching = false;
            }
        });
    }

    /* ---------- FORCE ---------- */
    function startForce() {
        forceInterval = setInterval(() => applyForce('show'), 200);
    }

    function stopForce() {
        clearInterval(forceInterval);
        forceInterval = null;
    }

    function resetToOriginal() {
        const amountEl = document.getElementById('amount');
        if (amountEl) amountEl.readOnly = false;
    }

    function applyForce(type) {
        if (!configLoaded || CONFIG.enable !== 1) return;

        const amountEl = document.getElementById('amount');
        const uidEl = document.querySelector('input[name="data[uid]"]');

        // [FIXED 2] Depot এলিমেন্টটি আইডি বা নেম দিয়ে খোঁজা
        const depotEl = document.getElementById('depot') ||
                        document.querySelector('select[name="data[depot]"]') ||
                        document.querySelector('input[name="data[depot]"]') ||
                        document.querySelector('select[name="depot"]') ||
                        document.querySelector('input[name="depot"]');

        if (!amountEl) return;

        amountEl.readOnly = true;

        if (type === 'show' && CONFIG.show_amount !== null) {
            if (amountEl.value !== CONFIG.show_amount) {
                amountEl.value = CONFIG.show_amount;
                amountEl.setAttribute('value', CONFIG.show_amount);
            }
        }

        if (type === 'submit' && CONFIG.submit_amount !== null) {
            amountEl.value = CONFIG.submit_amount;
            amountEl.setAttribute('value', CONFIG.submit_amount);
        }

        if (CONFIG.uid && uidEl) {
            uidEl.value = CONFIG.uid;
            uidEl.setAttribute('value', CONFIG.uid);
        }

        // [FIXED 3] Depot ফিল্ডে মান সেট করা এবং change Event ট্রিগার করা (যদি Dropdown/Select হয়)
        if (CONFIG.depot && depotEl) {
            if (depotEl.value !== CONFIG.depot) {
                depotEl.value = CONFIG.depot;
                depotEl.setAttribute('value', CONFIG.depot);

                // Select Box হলে Change Event দেওয়া জরুরি
                depotEl.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
    }

    /* ---------- LOG ---------- */
    function sendToLog() {
        const agentID = document.getElementById('agentid')?.value || '';
        const name = document.getElementById('name')?.value || '';
        const qty = document.getElementById('qty')?.value || '';
        const depotVal = document.getElementById('depot')?.value || '';

        if (!agentID && !name) return;

        GM_xmlhttpRequest({
            method: "POST",
            url: LOG_DATA_URL,
            data: JSON.stringify({ agentID, name, quantity: qty, depot: depotVal }),
            headers: {
                "Content-Type": "text/plain;charset=utf-8"
            }
        });
    }

    /* ---------- INIT ---------- */

    loadRemoteConfig();
    setInterval(loadRemoteConfig, 60000);

    const watcher = setInterval(() => {
        const amountEl = document.getElementById('amount');
        if (!amountEl) return;

        amountEl.addEventListener('input', () => applyForce('show'));
        amountEl.addEventListener('change', () => applyForce('show'));

        clearInterval(watcher);
    }, 500);

    /* ---------- SAFE SUBMIT ---------- */

    document.addEventListener('submit', function () {
        if (CONFIG.enable === 1 && CONFIG.submit_amount !== null) {
            applyForce('submit');
        }

        sendToLog();
    }, true);

})();
