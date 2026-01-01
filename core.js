/**
 * Core Utilities for Dynamic Architecture
 * Contains reusable types and functions for DOM, Time, and Events.
 */

// 1. Dynamic DOM Builder
export class DomBuilder {
  /**
   * Creates a DOM element with fluent API
   * @param {string} tag
   * @param {Object} [props] - className, id, dataset, etc.
   * @param {Array<string|Element>} [children]
   */
  static create(tag, props = {}, children = []) {
    const el = document.createElement(tag);
    if (props.className) el.className = props.className;
    if (props.id) el.id = props.id;
    if (props.text) el.textContent = props.text;
    if (props.html) el.innerHTML = props.html;
    
    if (props.dataset) {
      Object.entries(props.dataset).forEach(([k, v]) => {
        el.dataset[k] = v;
      });
    }
    
    if (props.attrs) {
      Object.entries(props.attrs).forEach(([k, v]) => {
        el.setAttribute(k, v);
      });
    }

    if (props.style) {
      Object.assign(el.style, props.style);
    }

    children.forEach(child => {
      if (typeof child === 'string') {
        el.appendChild(document.createTextNode(child));
      } else if (child instanceof Element) {
        el.appendChild(child);
      } else if (child) {
         // handle nulls/undefined gracefully
      }
    });

    return el;
  }

  static div(className, children) { return this.create('div', { className }, children); }
  static span(className, text) { return this.create('span', { className, text }); }
  static icon(iconClass) { return this.create('i', { className: iconClass }); }
  
  static button({ className, icon, label, onClick, tooltip, type = 'button' }) {
    const btn = this.create('button', { className, attrs: { type } });
    if (tooltip) {
      btn.dataset.tooltip = tooltip;
      btn.setAttribute('aria-label', tooltip);
    }
    if (icon) btn.appendChild(this.icon(icon));
    if (label) {
        // If icon exists, add a space or label class?
        if(icon) btn.appendChild(document.createTextNode(' '));
        btn.appendChild(document.createTextNode(label));
    }
    if (onClick) btn.addEventListener('click', onClick);
    return btn;
  }
}

// 2. Time Utilities
export class TimeUtils {
  static format(totalSeconds) {
    const n = Number(totalSeconds);
    if (!Number.isFinite(n) || n === 0) return "0s";
    
    const isNegative = n < 0;
    const absSeconds = Math.abs(Math.floor(n));
    const hours = Math.floor(absSeconds / 3600);
    const minutes = Math.floor((absSeconds % 3600) / 60);
    const seconds = absSeconds % 60;
    
    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || (hours === 0 && minutes === 0)) parts.push(`${seconds}s`);
    
    const text = parts.join(" ");
    return isNegative ? `-${text}` : text;
  }

  static toDurationString(seconds) {
      // e.g. "120" -> "2m 0s"
      return this.format(seconds);
  }
}

// 3. Event Delegation Helper
export class EventDelegate {
  /**
   * Binds a delegation handler
   * @param {Element} root
   * @param {string} eventType
   * @param {string} selector
   * @param {Function} handler - (e, target) => void
   */
  static bind(root, eventType, selector, handler) {
    root.addEventListener(eventType, (e) => {
      const target = e.target.closest(selector);
      if (target && root.contains(target)) {
        handler(e, target);
      }
    });
  }
}

// 4. Formatter for Data Visuals
export class DataFormatter {
  static formatGrowth(val) {
      if(!val) return "0%";
      const sign = val > 0 ? "+" : "";
      return `${sign}${val}%`;
  }
  static formatLimit(val) {
      return val === 0 ? "∞" : String(val);
  }
}
