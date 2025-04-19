const { updateStatus } = require('../src/js/updateStatus');

describe('updateStatus', () => {
  beforeEach(() => {
    global.chrome = { runtime: { sendMessage: jest.fn() } };
  });

  it('sends correct message with all parameters', () => {
    updateStatus('msg', 50, 'complete', { currentRecord: 'Rec', currentField: 'Fld', error: 'Err' });
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: 'auditStatus',
      message: 'msg',
      progress: 50,
      status: 'complete',
      currentRecord: 'Rec',
      currentField: 'Fld',
      error: 'Err'
    });
  });

  it('uses default parameters when optional arguments are omitted', () => {
    updateStatus('hello');
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: 'auditStatus',
      message: 'hello',
      progress: null,
      status: 'in_progress',
      currentRecord: null,
      currentField: null,
      error: null
    });
  });
});
