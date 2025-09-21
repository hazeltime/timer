/** @jest-environment jsdom */
import { jest } from '@jest/globals';
import { showConfirmationModal, hideConfirmationModal, showAlert } from '../ui.js';

describe('UI modal flows', () => {
  let modalRoot;
  let state;

  beforeEach(() => {
    // Minimal modal DOM matching components/modal.html
    document.body.innerHTML = `
      <div id="confirm-modal" class="modal-overlay" style="display:none;">
        <div class="modal-content">
          <h2 id="modal-title"></h2>
          <p id="modal-text"></p>
          <div class="modal-actions">
            <button id="modal-cancel-btn">Cancel</button>
            <button id="modal-confirm-btn">Confirm</button>
          </div>
        </div>
      </div>
    `;
    modalRoot = {
      confirmModal: document.getElementById('confirm-modal'),
      modalTitle: document.getElementById('modal-title'),
      modalText: document.getElementById('modal-text'),
      modalCancelBtn: document.getElementById('modal-cancel-btn'),
      modalConfirmBtn: document.getElementById('modal-confirm-btn'),
    };
    state = {};
  });

  test('showConfirmationModal displays modal with title and text and registers callback', () => {
    const onConfirm = jest.fn();
    showConfirmationModal(modalRoot, state, 'Test Title', 'Hello world', onConfirm, 'confirm');
    expect(modalRoot.confirmModal.style.display).toBe('flex');
    expect(modalRoot.confirmModal.classList.contains('show')).toBe(true);
    expect(modalRoot.modalTitle.textContent).toBe('Test Title');
    expect(modalRoot.modalText.textContent).toBe('Hello world');
    // ensure callback stored on state
    expect(typeof state.confirmCallback).toBe('function');
    // simulate the app-level confirm click handler calling the callback
    state.confirmCallback();
    expect(onConfirm).toHaveBeenCalled();
    // hide the modal and ensure it is not visible
    hideConfirmationModal(modalRoot);
    expect(modalRoot.confirmModal.classList.contains('show')).toBe(false);
  });

  test('showAlert uses modal when present and hides cancel button', () => {
    showAlert(modalRoot, 'Alert!', 'Important');
    expect(modalRoot.modalCancelBtn.style.display).toBe('none');
    expect(modalRoot.modalConfirmBtn.textContent).toBe('OK');
    expect(modalRoot.modalTitle.textContent).toBe('Alert!');
    expect(modalRoot.confirmModal.style.display).toBe('flex');
  });

  test('showAlert falls back to console.warn when modal missing', () => {
    // remove modal elements to force fallback
    document.body.innerHTML = '';
    const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    showAlert(null, 'Fallback', 'No modal');
    expect(spy).toHaveBeenCalledWith('No modal');
    spy.mockRestore();
  });
});
