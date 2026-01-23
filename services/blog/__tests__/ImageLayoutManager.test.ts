import { describe, it, expect, beforeEach } from 'vitest';
import { ImageLayoutManager } from '../ImageLayoutManager';

describe('ImageLayoutManager', () => {
  let manager: ImageLayoutManager;
  let doc: Document;

  beforeEach(() => {
    manager = new ImageLayoutManager();
    doc = new DOMParser().parseFromString('<html><body></body></html>', 'text/html');
  });

  describe('processImages', () => {
    it('should handle document with no images', () => {
      const content = '<p>No images here</p>';
      doc.body.innerHTML = content;

      manager.processImages(doc);

      expect(doc.body.innerHTML).toContain('No images here');
    });

    it('should strip width and height attributes from images', () => {
      const imgHTML = '<img src="test.jpg" width="500" height="300" style="float: left;" />';
      doc.body.innerHTML = imgHTML;

      manager.processImages(doc);
      const img = doc.querySelector('img');

      expect(img).toBeTruthy();
      expect(img?.hasAttribute('width')).toBe(false);
      expect(img?.hasAttribute('height')).toBe(false);
      // Style attribute gets replaced with new styling
      expect(img?.hasAttribute('style')).toBe(true);
    });

    it('should use data-width if set', () => {
      const imgHTML = '<img src="test.jpg" data-width="350" data-align="center" />';
      doc.body.innerHTML = imgHTML;

      manager.processImages(doc);
      const img = doc.querySelector('img');

      expect(img?.style.width).toBe('350px');
    });

    it('should default to 450px width if no data-width', () => {
      const imgHTML = '<img src="test.jpg" data-align="center" />';
      doc.body.innerHTML = imgHTML;

      manager.processImages(doc);
      const img = doc.querySelector('img');

      // Should have width set (exact value may be in style attribute)
      expect(img?.getAttribute('style')).toContain('450px');
    });

    it('should NOT create flex container for center-aligned images', () => {
      const html = '<img src="test.jpg" data-align="center" /><p>Next paragraph</p>';
      doc.body.innerHTML = html;

      manager.processImages(doc);

      // Should not have flex container
      expect(doc.querySelector('.blog-image-text-row')).toBe(null);
    });

    it('should create flex container for left-aligned image with following paragraph', () => {
      const html = '<img src="test.jpg" data-align="left" data-width="300" /><p>This text should be beside the image</p>';
      doc.body.innerHTML = html;

      manager.processImages(doc);

      // Should have flex container
      const flexContainer = doc.querySelector('.blog-image-text-row');
      expect(flexContainer).toBeTruthy();
      expect(flexContainer?.getAttribute('style')).toContain('display: flex');

      // Image should be first child (left alignment)
      const img = flexContainer?.querySelector('img');
      expect(img).toBeTruthy();
      expect(flexContainer?.firstElementChild?.tagName).toBe('IMG');
    });

    it('should create flex container for right-aligned image with paragraph on left', () => {
      const html = '<img src="test.jpg" data-align="right" data-width="300" /><p>This text should be on the left</p>';
      doc.body.innerHTML = html;

      manager.processImages(doc);

      const flexContainer = doc.querySelector('.blog-image-text-row');
      expect(flexContainer).toBeTruthy();

      // Paragraph should be first child (right alignment means text first)
      expect(flexContainer?.firstElementChild?.tagName).toBe('P');
    });

    it('should NOT create flex container for image with no following paragraph', () => {
      const html = '<img src="test.jpg" data-align="left" />';
      doc.body.innerHTML = html;

      manager.processImages(doc);

      expect(doc.querySelector('.blog-image-text-row')).toBe(null);
    });

    it('should NOT create flex container if next sibling is heading', () => {
      const html = '<img src="test.jpg" data-align="left" /><h2>Next Section</h2>';
      doc.body.innerHTML = html;

      manager.processImages(doc);

      expect(doc.querySelector('.blog-image-text-row')).toBe(null);
    });

    it('should handle images wrapped in figure elements', () => {
      const html = '<figure><img src="test.jpg" data-align="center" /></figure>';
      doc.body.innerHTML = html;

      manager.processImages(doc);
      const img = doc.querySelector('img');

      expect(img).toBeTruthy();
      expect(img?.getAttribute('style')).toBeTruthy();
    });

    it('should unwrap single image from paragraph', () => {
      const html = '<p><img src="test.jpg" /></p>';
      doc.body.innerHTML = html;

      manager.processImages(doc);

      // Image should no longer be wrapped in <p>
      const p = doc.querySelector('p');
      expect(p).toBe(null);
      expect(doc.body.querySelector('img')).toBeTruthy();
    });

    it('should handle multiple images in document', () => {
      const html = '<img src="img1.jpg" data-align="left" /><p>Text 1</p><img src="img2.jpg" data-align="right" /><p>Text 2</p>';
      doc.body.innerHTML = html;

      manager.processImages(doc);

      const flexContainers = doc.querySelectorAll('.blog-image-text-row');
      expect(flexContainers.length).toBe(2);
    });

    it('should handle float-left and float-right alignment', () => {
      const html = '<img src="test.jpg" data-align="float-left" /><p>Text beside image</p>';
      doc.body.innerHTML = html;

      manager.processImages(doc);

      expect(doc.querySelector('.blog-image-text-row')).toBeTruthy();
    });

    it('should apply proper styling to center-aligned images', () => {
      const html = '<img src="test.jpg" data-align="center" />';
      doc.body.innerHTML = html;

      manager.processImages(doc);
      const img = doc.querySelector('img');

      // Should have styling for centering
      expect(img?.getAttribute('style')).toContain('margin');
    });
  });

  describe('adjustImageSizes', () => {
    it('should not process already processed images', () => {
      const container = document.createElement('div');
      const img = document.createElement('img') as HTMLImageElement;
      img.dataset.aspectProcessed = 'true';
      img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      container.appendChild(img);

      manager.adjustImageSizes(container);

      // Should skip already processed images
      expect(img.classList.contains('aspect-portrait')).toBe(false);
      expect(img.classList.contains('aspect-landscape')).toBe(false);
    });
  });
});
