import { extractPdfText, findValueInPdf, clickNextPageButton, findAndClickResident } from "../src/js/content-helpers";

describe('Content Helpers', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('extractPdfText', () => {
    it('returns text from .pdf-content element', () => {
      document.body.innerHTML = '<div class="pdf-content">PDF TEXT</div>';
      expect(extractPdfText()).toBe('PDF TEXT');
    });

    it('falls back to document body text when no pdf elements', () => {
      document.body.innerHTML = '<div>Other</div>';
      document.body.innerText = 'WHOLE DOCUMENT';
      expect(extractPdfText()).toBe('WHOLE DOCUMENT');
    });
  });

  describe('findValueInPdf', () => {
    it('extracts value after label on same line', () => {
      const text = 'Label: Value\nNext: Test';
      expect(findValueInPdf('Label', text)).toBe('Value');
    });

    it('extracts value from next line when no colon present', () => {
      const text = 'Label\nNEXT LINE VALUE\nOther';
      expect(findValueInPdf('Label', text)).toBe('NEXT LINE VALUE');
    });

    it('returns null when label not found', () => {
      expect(findValueInPdf('Missing', 'Some text')).toBeNull();
    });
  });

  describe('clickNextPageButton', () => {
    it('clicks a "Next" button and returns true', () => {
      const btn = document.createElement('button');
      btn.textContent = 'Next';
      const clickSpy = jest.spyOn(btn, 'click');
      document.body.appendChild(btn);
      expect(clickNextPageButton()).toBe(true);
      expect(clickSpy).toHaveBeenCalled();
    });

    it('returns false when no matching element', () => {
      document.body.innerHTML = '<span>Nope</span>';
      expect(clickNextPageButton()).toBe(false);
    });
  });

  describe('findAndClickResident', () => {
    it('clicks exact match and returns true', async () => {
      const el = document.createElement('a');
      el.textContent = 'Jane Doe';
      const clickSpy = jest.spyOn(el, 'click');
      document.body.appendChild(el);
      const result = await findAndClickResident('Jane', 'Doe');
      expect(result).toBe(true);
      expect(clickSpy).toHaveBeenCalled();
    });

    it('clicks partial match and returns true', async () => {
      const el = document.createElement('span');
      el.textContent = 'Jane Doe Jr.';
      const clickSpy = jest.spyOn(el, 'click');
      document.body.appendChild(el);
      const result = await findAndClickResident('Jane', 'Doe');
      expect(result).toBe(true);
      expect(clickSpy).toHaveBeenCalled();
    });

    it('returns false when no matches and no next page', async () => {
      document.body.innerHTML = '';
      const result = await findAndClickResident('X', 'Y');
      expect(result).toBe(false);
    });
  });
});
