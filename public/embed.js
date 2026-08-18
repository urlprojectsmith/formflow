(function () {
  'use strict';

  // Helper to resolve origin from script source or current window
  function getScriptOrigin() {
    if (document.currentScript && document.currentScript.src) {
      try {
        var url = new URL(document.currentScript.src);
        return url.origin;
      } catch (e) {}
    }
    return window.location.origin;
  }

  var SCRIPT_ORIGIN = getScriptOrigin();

  // Initialize all uninitialized FormFlow embed containers
  function initFormFlowEmbeds() {
    var containers = document.querySelectorAll('[data-formflow-id]:not([data-formflow-initialized])');

    containers.forEach(function (container) {
      container.setAttribute('data-formflow-initialized', 'true');

      var formId = container.getAttribute('data-formflow-id');
      var mode = container.getAttribute('data-formflow-mode') || 'inline'; // 'inline', 'popup', 'slide_in', 'sticky'
      var position = container.getAttribute('data-formflow-position') || 'right'; // 'left', 'right'
      var triggerType = container.getAttribute('data-formflow-trigger') || 'always'; // 'always', 'scroll', 'delay'
      var scrollPct = parseInt(container.getAttribute('data-formflow-scroll-pct') || '0', 10);
      var delaySec = parseInt(container.getAttribute('data-formflow-delay-sec') || '0', 10);
      var visitCount = parseInt(container.getAttribute('data-formflow-visit-count') || '1', 10);
      var maxDisplays = parseInt(container.getAttribute('data-formflow-max-displays') || '0', 10);
      var deactivateOnLead = container.getAttribute('data-formflow-deactivate-lead') === 'true';
      var triggerText = container.getAttribute('data-formflow-trigger-text') || 'Open Form';
      var triggerColor = container.getAttribute('data-formflow-trigger-color') || '#2563eb';

      var instanceId = 'ff_inst_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();

      // Deactivation Check 1: Lead collected
      if (deactivateOnLead && localStorage.getItem('ff_lead_collected_' + formId) === 'true') {
        return;
      }

      // Deactivation Check 2: Max displays
      var currentDisplays = parseInt(localStorage.getItem('ff_displays_' + formId) || '0', 10);
      if (maxDisplays > 0 && currentDisplays >= maxDisplays) {
        return;
      }

      // Activation Check: Visit count
      var currentVisits = parseInt(localStorage.getItem('ff_visits_' + formId) || '0', 10);
      if (!sessionStorage.getItem('ff_visited_session_' + formId)) {
        currentVisits += 1;
        localStorage.setItem('ff_visits_' + formId, currentVisits.toString());
        sessionStorage.setItem('ff_visited_session_' + formId, 'true');
      }
      if (visitCount > 1 && currentVisits < visitCount) {
        return;
      }

      var iframeUrl = SCRIPT_ORIGIN + '/f/' + encodeURIComponent(formId) + '?embed=true&mode=' + encodeURIComponent(mode) + '&instanceId=' + encodeURIComponent(instanceId);

      // Build iframe element
      var iframe = document.createElement('iframe');
      iframe.src = iframeUrl;
      iframe.id = instanceId;
      iframe.setAttribute('data-formflow-instance', instanceId);
      iframe.setAttribute('data-formflow-id', formId);
      iframe.style.width = '100%';
      iframe.style.border = 'none';
      iframe.style.overflow = 'hidden';
      iframe.style.transition = 'height 0.2s ease-in-out';
      iframe.style.borderRadius = '12px';

      function incrementDisplayCount() {
        var count = parseInt(localStorage.getItem('ff_displays_' + formId) || '0', 10);
        localStorage.setItem('ff_displays_' + formId, (count + 1).toString());
      }

      // 1. INLINE MODE
      if (mode === 'inline') {
        iframe.style.height = '450px';
        container.appendChild(iframe);
        incrementDisplayCount();
        return;
      }

      // 2. POPUP MODAL OVERLAY MODE
      if (mode === 'popup') {
        var overlay = document.createElement('div');
        overlay.id = 'ff_overlay_' + instanceId;
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.backgroundColor = 'rgba(15, 23, 42, 0.65)';
        overlay.style.backdropFilter = 'blur(4px)';
        overlay.style.zIndex = '99999';
        overlay.style.display = 'none';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.padding = '20px';

        var modalBox = document.createElement('div');
        modalBox.style.position = 'relative';
        modalBox.style.width = '100%';
        modalBox.style.maxWidth = '640px';
        modalBox.style.maxHeight = '90vh';
        modalBox.style.backgroundColor = '#ffffff';
        modalBox.style.borderRadius = '16px';
        modalBox.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25)';
        modalBox.style.overflow = 'hidden';
        modalBox.style.display = 'flex';
        modalBox.style.flexDirection = 'column';

        var closeBtn = document.createElement('button');
        closeBtn.innerHTML = '&#10005;';
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = '12px';
        closeBtn.style.right = '12px';
        closeBtn.style.zIndex = '10';
        closeBtn.style.width = '32px';
        closeBtn.style.height = '32px';
        closeBtn.style.borderRadius = '50%';
        closeBtn.style.border = 'none';
        closeBtn.style.backgroundColor = '#f1f5f9';
        closeBtn.style.color = '#334155';
        closeBtn.style.fontWeight = 'bold';
        closeBtn.style.cursor = 'pointer';
        closeBtn.onclick = function () {
          overlay.style.display = 'none';
        };

        iframe.style.height = '500px';
        modalBox.appendChild(closeBtn);
        modalBox.appendChild(iframe);
        overlay.appendChild(modalBox);
        document.body.appendChild(overlay);

        function showPopup() {
          overlay.style.display = 'flex';
          incrementDisplayCount();
        }

        setupTrigger(triggerType, scrollPct, delaySec, showPopup);
        createTriggerBtn(container, triggerText, triggerColor, showPopup);
        return;
      }

      // 3. POLITE SLIDE-IN MODE
      if (mode === 'slide_in') {
        var slideBox = document.createElement('div');
        slideBox.id = 'ff_slide_' + instanceId;
        slideBox.style.position = 'fixed';
        slideBox.style.bottom = '20px';
        if (position === 'left') {
          slideBox.style.left = '20px';
        } else {
          slideBox.style.right = '20px';
        }
        slideBox.style.width = '380px';
        slideBox.style.maxWidth = 'calc(100vw - 40px)';
        slideBox.style.backgroundColor = '#ffffff';
        slideBox.style.borderRadius = '16px';
        slideBox.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
        slideBox.style.border = '1px solid #e2e8f0';
        slideBox.style.zIndex = '99998';
        slideBox.style.display = 'none';
        slideBox.style.flexDirection = 'column';
        slideBox.style.overflow = 'hidden';

        var slideCloseBtn = document.createElement('button');
        slideCloseBtn.innerHTML = '&#10005;';
        slideCloseBtn.style.position = 'absolute';
        slideCloseBtn.style.top = '10px';
        slideCloseBtn.style.right = '10px';
        slideCloseBtn.style.zIndex = '10';
        slideCloseBtn.style.width = '28px';
        slideCloseBtn.style.height = '28px';
        slideCloseBtn.style.borderRadius = '50%';
        slideCloseBtn.style.border = 'none';
        slideCloseBtn.style.backgroundColor = '#f1f5f9';
        slideCloseBtn.style.color = '#334155';
        slideCloseBtn.style.fontWeight = 'bold';
        slideCloseBtn.style.cursor = 'pointer';
        slideCloseBtn.onclick = function () {
          slideBox.style.display = 'none';
        };

        iframe.style.height = '420px';
        slideBox.appendChild(slideCloseBtn);
        slideBox.appendChild(iframe);
        document.body.appendChild(slideBox);

        function showSlideIn() {
          slideBox.style.display = 'flex';
          incrementDisplayCount();
        }

        setupTrigger(triggerType, scrollPct, delaySec, showSlideIn);
        createTriggerBtn(container, triggerText, triggerColor, showSlideIn);
        return;
      }

      // 4. STICKY SIDEBAR MODE
      if (mode === 'sticky') {
        var stickyBtn = document.createElement('button');
        stickyBtn.innerHTML = triggerText;
        stickyBtn.style.position = 'fixed';
        stickyBtn.style.top = '50%';
        stickyBtn.style.transform = 'translateY(-50%)';
        if (position === 'left') {
          stickyBtn.style.left = '0';
          stickyBtn.style.borderRadius = '0 8px 8px 0';
        } else {
          stickyBtn.style.right = '0';
          stickyBtn.style.borderRadius = '8px 0 0 8px';
        }
        stickyBtn.style.padding = '12px 18px';
        stickyBtn.style.backgroundColor = triggerColor;
        stickyBtn.style.color = '#ffffff';
        stickyBtn.style.fontWeight = 'bold';
        stickyBtn.style.fontSize = '13px';
        stickyBtn.style.border = 'none';
        stickyBtn.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
        stickyBtn.style.cursor = 'pointer';
        stickyBtn.style.zIndex = '99997';

        var drawerOverlay = document.createElement('div');
        drawerOverlay.id = 'ff_drawer_' + instanceId;
        drawerOverlay.style.position = 'fixed';
        drawerOverlay.style.top = '0';
        drawerOverlay.style.bottom = '0';
        if (position === 'left') {
          drawerOverlay.style.left = '0';
        } else {
          drawerOverlay.style.right = '0';
        }
        drawerOverlay.style.width = '420px';
        drawerOverlay.style.maxWidth = '100vw';
        drawerOverlay.style.backgroundColor = '#ffffff';
        drawerOverlay.style.boxShadow = '0 25px 50px -12px rgba(0,0,0,0.25)';
        drawerOverlay.style.zIndex = '99999';
        drawerOverlay.style.display = 'none';
        drawerOverlay.style.flexDirection = 'column';
        drawerOverlay.style.borderLeft = '1px solid #e2e8f0';

        var drawerCloseBtn = document.createElement('button');
        drawerCloseBtn.innerHTML = '&#10005; Close';
        drawerCloseBtn.style.padding = '12px 16px';
        drawerCloseBtn.style.backgroundColor = '#f8fafc';
        drawerCloseBtn.style.border = 'none';
        drawerCloseBtn.style.borderBottom = '1px solid #e2e8f0';
        drawerCloseBtn.style.textAlign = 'right';
        drawerCloseBtn.style.fontWeight = 'bold';
        drawerCloseBtn.style.fontSize = '12px';
        drawerCloseBtn.style.color = '#475569';
        drawerCloseBtn.style.cursor = 'pointer';
        drawerCloseBtn.onclick = function () {
          drawerOverlay.style.display = 'none';
        };

        iframe.style.height = '100%';
        drawerOverlay.appendChild(drawerCloseBtn);
        drawerOverlay.appendChild(iframe);
        document.body.appendChild(stickyBtn);
        document.body.appendChild(drawerOverlay);

        function openStickyDrawer() {
          drawerOverlay.style.display = 'flex';
          incrementDisplayCount();
        }

        stickyBtn.onclick = openStickyDrawer;
        setupTrigger(triggerType, scrollPct, delaySec, openStickyDrawer);
        return;
      }
    });
  }

  // Setup trigger mechanism (Always, Scroll %, Delay seconds)
  function setupTrigger(type, scrollPct, delaySec, callback) {
    if (type === 'scroll' && scrollPct > 0) {
      var triggered = false;
      var handleScroll = function () {
        if (triggered) return;
        var totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (totalHeight <= 0) return;
        var currentPct = (window.scrollY / totalHeight) * 100;
        if (currentPct >= scrollPct) {
          triggered = true;
          window.removeEventListener('scroll', handleScroll);
          callback();
        }
      };
      window.addEventListener('scroll', handleScroll);
    } else if (type === 'delay' && delaySec > 0) {
      setTimeout(callback, delaySec * 1000);
    } else {
      // Always show
      callback();
    }
  }

  // Helper to create inline/container trigger button if container is provided
  function createTriggerBtn(container, text, color, onClick) {
    if (!container || container.children.length > 0) return;
    var btn = document.createElement('button');
    btn.innerHTML = text;
    btn.style.padding = '10px 20px';
    btn.style.backgroundColor = color;
    btn.style.color = '#ffffff';
    btn.style.fontWeight = 'bold';
    btn.style.fontSize = '13px';
    btn.style.border = 'none';
    btn.style.borderRadius = '8px';
    btn.style.cursor = 'pointer';
    btn.onclick = onClick;
    container.appendChild(btn);
  }

  // Handle PostMessage events from iframe to host window
  window.addEventListener('message', function (event) {
    if (!event.data || typeof event.data !== 'object') return;
    if (SCRIPT_ORIGIN && event.origin && event.origin !== SCRIPT_ORIGIN) return;

    var data = event.data;
    var instanceId = data.instanceId;
    if (!instanceId) return;

    var iframe = document.getElementById(instanceId);

    // 1. Height Adjustment
    if (data.type === 'formflow:height' && iframe && data.height) {
      iframe.style.height = Math.max(200, data.height + 20) + 'px';
    }

    // 2. Loaded Public Event
    if (data.type === 'formflow:loaded') {
      window.dispatchEvent(
        new CustomEvent('formflow:loaded', {
          detail: { formId: data.formId, instanceId: instanceId },
        })
      );
    }

    // 3. Submitted Public Event
    if (data.type === 'formflow:submitted') {
      if (data.formId) {
        localStorage.setItem('ff_lead_collected_' + data.formId, 'true');
      }

      window.dispatchEvent(
        new CustomEvent('formflow:submitted', {
          detail: {
            formId: data.formId,
            instanceId: instanceId,
            submissionId: data.submissionId,
          },
        })
      );
    }

    // 4. Error Public Event
    if (data.type === 'formflow:error') {
      window.dispatchEvent(
        new CustomEvent('formflow:error', {
          detail: {
            formId: data.formId,
            instanceId: instanceId,
            error: data.error,
          },
        })
      );
    }

    // 5. Close Event
    if (data.type === 'formflow:close') {
      var overlay = document.getElementById('ff_overlay_' + instanceId);
      if (overlay) overlay.style.display = 'none';

      var slideBox = document.getElementById('ff_slide_' + instanceId);
      if (slideBox) slideBox.style.display = 'none';

      var drawer = document.getElementById('ff_drawer_' + instanceId);
      if (drawer) drawer.style.display = 'none';
    }
  });

  // Auto initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFormFlowEmbeds);
  } else {
    initFormFlowEmbeds();
  }

  // Export global initializer if needed
  window.FormFlowEmbed = {
    init: initFormFlowEmbeds,
  };
})();
