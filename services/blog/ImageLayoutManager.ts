/**
 * ImageLayoutManager
 * Handles image sizing, flex container creation, and aspect ratio adjustments
 */
export class ImageLayoutManager {
  /**
   * Process images in the document: create flex containers with text, apply sizing
   */
  processImages(doc: Document): void {
    doc.querySelectorAll('img').forEach((img) => {
      // Strip all inline styles first (will be re-applied below)
      img.removeAttribute('width');
      img.removeAttribute('height');
      img.removeAttribute('style');

      // Get editor-set width and alignment (from ResizableImage extension)
      const dataWidth = img.getAttribute('data-width');
      const dataAlign = img.getAttribute('data-align') || 'center';

      // Determine image width
      // If data-width is set (new editor format), use it
      // Otherwise, default to 450px landscape (will be adjusted to 250px for portraits later)
      let imageWidth = '450px';
      if (dataWidth && dataWidth !== 'null' && dataWidth !== '') {
        imageWidth = typeof dataWidth === 'string' && dataWidth.includes('%')
          ? dataWidth
          : `${dataWidth}px`;
      }

      // Store whether width was explicitly set (for portrait adjustment logic)
      const hasExplicitWidth = !!(dataWidth && dataWidth !== 'null' && dataWidth !== '');
      if (hasExplicitWidth) {
        img.setAttribute('data-has-explicit-width', 'true');
      }

      // Find the container element (could be figure, p with just img, or the img itself)
      let imageElement: Element = img;
      const parent = img.parentElement;

      // For figures, keep the wrapper
      if (parent && parent.tagName === 'FIGURE') {
        imageElement = parent;
      }
      // For paragraphs containing only the image, unwrap for better flex alignment
      else if (parent && parent.tagName === 'P' && parent.childNodes.length === 1) {
        // Unwrap: replace the <p> with just the <img>
        const grandParent = parent.parentElement;
        if (grandParent) {
          grandParent.insertBefore(img, parent);
          parent.remove();
          imageElement = img;
        }
      }

      // Find the first paragraph after the image for flex layout
      let nextParagraph: Element | null = null;
      let sibling = imageElement.nextElementSibling;
      while (sibling) {
        if (sibling.tagName === 'P' && sibling.textContent?.trim()) {
          nextParagraph = sibling;
          break;
        }
        // Stop if we hit a heading or another image
        if (sibling.tagName.match(/^H[1-6]$/) || sibling.querySelector('img')) {
          break;
        }
        sibling = sibling.nextElementSibling;
      }

      // Only create flex containers for left/right aligned images
      // Center-aligned images should stand alone
      const shouldCreateFlexContainer = nextParagraph &&
        (dataAlign === 'left' || dataAlign === 'right' || dataAlign === 'float-left' || dataAlign === 'float-right');

      if (shouldCreateFlexContainer && nextParagraph) {
        // Create flex container for side-by-side layout with vertical centering
        const flexContainer = doc.createElement('div');
        flexContainer.className = 'blog-image-text-row';

        // Determine if image should be on right side
        const imageOnRight = dataAlign === 'right' || dataAlign === 'float-right';

        flexContainer.setAttribute('style', `display: flex; align-items: center; gap: 2rem; margin: 2rem 0; width: 100%;`);

        // Style the image - ensure it's a block element with no margins
        img.setAttribute('style', `width: ${imageWidth}; height: auto; border-radius: 0.75rem; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3); display: block; margin: 0; align-self: center; flex-shrink: 0;`);

        // Style the paragraph to remove all margins and set flex properties
        nextParagraph.setAttribute('style', 'margin: 0; padding: 0; flex: 1; min-width: 0; align-self: center; display: block;');

        // Get the parent before we start moving elements
        const parentElement = imageElement.parentNode;

        // Insert flex container before image element
        if (parentElement) {
          parentElement.insertBefore(flexContainer, imageElement);

          // Add elements in correct order based on alignment
          if (imageOnRight) {
            // Right alignment: paragraph first, then image
            flexContainer.appendChild(nextParagraph);
            if (imageElement === img) {
              flexContainer.appendChild(img);
            } else {
              flexContainer.appendChild(imageElement);
            }
          } else {
            // Left alignment: image first, then paragraph
            if (imageElement === img) {
              flexContainer.appendChild(img);
            } else {
              flexContainer.appendChild(imageElement);
            }
            flexContainer.appendChild(nextParagraph);
          }
        }
      } else {
        // No following paragraph - position based on alignment
        let alignStyle = 'display: block; margin: 2rem auto;'; // default center
        if (dataAlign === 'left') {
          alignStyle = 'display: block; margin: 2rem 0 2rem 0;';
        } else if (dataAlign === 'right') {
          alignStyle = 'display: block; margin: 2rem 0 2rem auto;';
        }
        img.setAttribute('style', `${alignStyle} width: ${imageWidth}; max-width: 100%; height: auto; border-radius: 0.75rem; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);`);
      }
    });
  }

  /**
   * Adjust portrait image sizes after they load (only if no explicit width was set in editor)
   */
  adjustImageSizes(container: HTMLElement): void {
    const adjustImageSize = (img: HTMLImageElement) => {
      if (img.dataset.aspectProcessed) return;

      const onLoad = () => {
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        const hasExplicitWidth = img.hasAttribute('data-has-explicit-width');

        // Only auto-adjust if no explicit width was set in the editor
        if (!hasExplicitWidth) {
          // Portrait images (taller than wide) get smaller width (250px)
          if (aspectRatio < 1) {
            img.style.setProperty('width', '250px', 'important');
            img.style.setProperty('min-width', '250px', 'important');
            img.style.setProperty('max-width', '250px', 'important');
            img.classList.add('aspect-portrait');
          } else {
            // Landscape images keep the 450px set in HTML processing
            img.classList.add('aspect-landscape');
          }
        } else {
          // Add aspect ratio class for CSS purposes only
          if (aspectRatio < 1) {
            img.classList.add('aspect-portrait');
          } else {
            img.classList.add('aspect-landscape');
          }
        }

        img.dataset.aspectProcessed = 'true';
      };

      if (img.complete && img.naturalWidth > 0) {
        onLoad();
      } else {
        img.addEventListener('load', onLoad, { once: true });
      }
    };

    const images = container.querySelectorAll('img');
    images.forEach((img) => adjustImageSize(img as HTMLImageElement));
  }
}
