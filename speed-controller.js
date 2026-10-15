(function () {
    // Ngăn tạo trùng khi bấm nhiều lần
    if (window.__speedController) {
        window.__speedController.show();
        return;
    }

    const controller = {
        speed: 1,
        enabled: false,
        panel: null,
        origRAF: window.requestAnimationFrame,
        origSetTimeout: window.setTimeout,
        origSetInterval: window.setInterval,
        origDateNow: Date.now,
        startTime: null,
        virtualTime: 0,
        rafId: null,
        callbacks: [],

        // ==== KHỞI TẠO ====
        init() {
            this.createPanel();
            this.hookFunctions();
        },

        // ==== TẠO BẢNG ĐIỀU KHIỂN ====
        createPanel() {
            const panel = document.createElement('div');
            panel.id = '__speed_panel__';
            panel.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 2147483647;
                background: linear-gradient(135deg, #1e1e2e, #2a2a40);
                color: #fff;
                padding: 14px 16px;
                border-radius: 12px;
                font-family: 'Segoe UI', Arial, sans-serif;
                font-size: 13px;
                box-shadow: 0 8px 24px rgba(0,0,0,0.4);
                width: 230px;
                user-select: none;
                border: 1px solid rgba(255,255,255,0.1);
            `;

            panel.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <strong style="color:#7dd3fc;">⚡ Speed Controller</strong>
                    <span id="__speed_close" style="cursor:pointer; color:#f87171; font-weight:bold;">✕</span>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                    <span>Trạng thái:</span>
                    <span id="__speed_status" style="color:#f87171; font-weight:bold;">OFF</span>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                    <span>Tốc độ:</span>
                    <span id="__speed_value" style="color:#7dd3fc; font-weight:bold;">1x</span>
                </div>
                <input id="__speed_range" type="range" min="1" max="100" step="1" value="1"
                    style="width:100%; cursor:pointer; accent-color:#7dd3fc;" />
                <div style="display:flex; gap:6px; margin-top:10px;">
                    <button id="__speed_toggle" style="flex:1; padding:8px; border:none; border-radius:8px; background:#22c55e; color:white; font-weight:bold; cursor:pointer;">BẬT</button>
                    <button id="__speed_reset" style="padding:8px 10px; border:none; border-radius:8px; background:#64748b; color:white; font-weight:bold; cursor:pointer;">↺</button>
                </div>
                <div style="margin-top:8px; font-size:10px; color:#94a3b8; text-align:center;">
                    Kéo để chỉnh tốc độ 1x - 100x
                </div>
            `;

            document.body.appendChild(panel);
            this.panel = panel;

            const range = panel.querySelector('#__speed_range');
            const valueEl = panel.querySelector('#__speed_value');
            const statusEl = panel.querySelector('#__speed_status');
            const toggleBtn = panel.querySelector('#__speed_toggle');
            const resetBtn = panel.querySelector('#__speed_reset');
            const closeBtn = panel.querySelector('#__speed_close');

            range.addEventListener('input', () => {
                this.speed = parseInt(range.value);
                valueEl.textContent = this.speed + 'x';
            });

            toggleBtn.addEventListener('click', () => {
                this.enabled = !this.enabled;
                if (this.enabled) {
                    statusEl.textContent = 'ON';
                    statusEl.style.color = '#4ade80';
                    toggleBtn.textContent = 'TẮT';
                    toggleBtn.style.background = '#ef4444';
                    this.startTime = this.origDateNow.call(Date);
                    this.virtualTime = this.startTime;
                } else {
                    statusEl.textContent = 'OFF';
                    statusEl.style.color = '#f87171';
                    toggleBtn.textContent = 'BẬT';
                    toggleBtn.style.background = '#22c55e';
                }
            });

            resetBtn.addEventListener('click', () => {
                this.speed = 1;
                range.value = 1;
                valueEl.textContent = '1x';
            });

            closeBtn.addEventListener('click', () => {
                panel.remove();
            });
        },

        // ==== HOOK CÁC HÀM THỜI GIAN ====
        hookFunctions() {
            const self = this;

            // ---- Hook requestAnimationFrame ----
            window.requestAnimationFrame = function (cb) {
                return self.origRAF.call(window, function (t) {
                    if (!self.enabled) return cb(t);
                    // Tăng tốc timestamps cho animation
                    return cb(t * self.speed);
                });
            };

            // ---- Hook setTimeout ----
            window.setTimeout = function (fn, delay, ...args) {
                if (!self.enabled || typeof fn !== 'function') {
                    return self.origSetTimeout.call(window, fn, delay, ...args);
                }
                const newDelay = Math.max(0, (delay || 0) / self.speed);
                return self.origSetTimeout.call(window, fn, newDelay, ...args);
            };

            // ---- Hook setInterval ----
            window.setInterval = function (fn, delay, ...args) {
                if (!self.enabled || typeof fn !== 'function') {
                    return self.origSetInterval.call(window, fn, delay, ...args);
                }
                const newDelay = Math.max(1, (delay || 0) / self.speed);
                return self.origSetInterval.call(window, fn, newDelay, ...args);
            };

            // ---- Hook Date.now (để code dùng Date.now thấy thời gian trôi nhanh hơn) ----
            Date.now = function () {
                if (!self.enabled || !self.startTime) {
                    return self.origDateNow.call(Date);
                }
                const realNow = self.origDateNow.call(Date);
                const elapsed = realNow - self.startTime;
                return self.startTime + elapsed * self.speed;
            };

            // ---- Hook performance.now ----
            if (window.performance && performance.now) {
                const origPerf = performance.now.bind(performance);
                performance.now = function () {
                    const t = origPerf();
                    return self.enabled ? t * self.speed : t;
                };
            }
        },

        show() {
            if (this.panel && !document.body.contains(this.panel)) {
                document.body.appendChild(this.panel);
            }
        }
    };

    controller.init();
    window.__speedController = controller;

    console.log('%c⚡ Speed Controller đã kích hoạt!', 'color:#7dd3fc;font-size:14px;font-weight:bold;');
})();
