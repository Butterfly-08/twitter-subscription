class MacDock {
  constructor(element, options = {}) {
    this.element = element;
    this.items = Array.from(element.querySelectorAll('.mac-dock-item'));
    
    this.options = {
      baseItemSize: 50,
      magnification: 70,
      distance: 200,
      panelHeight: 68,
      ...options
    };

    this.mouseX = Infinity;
    this.isHovered = false;
    this.animationFrame = null;

    this.init();
  }

  init() {
    this.items.forEach(item => {
      item.style.setProperty('--dock-item-size', `${this.options.baseItemSize}px`);
    });
    this.element.style.height = `${this.options.panelHeight}px`;

    this.element.addEventListener('mousemove', this.handleMouseMove);
    this.element.addEventListener('mouseleave', this.handleMouseLeave);
  }

  handleMouseMove = (e) => {
    this.isHovered = true;
    this.mouseX = e.clientX;
    
    // Use requestAnimationFrame for buttery smooth performance during mouse move
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    this.animationFrame = requestAnimationFrame(() => this.updateSizes());
  }

  handleMouseLeave = () => {
    this.isHovered = false;
    this.mouseX = Infinity;
    
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    this.updateSizes();
  }

  updateSizes() {
    if (!this.isHovered) {
      // Reset to base
      this.items.forEach(item => {
        item.style.setProperty('--dock-item-size', `${this.options.baseItemSize}px`);
      });
      this.element.style.height = `${this.options.panelHeight}px`;
      return;
    }

    let maxHeightSeen = this.options.panelHeight;

    this.items.forEach(item => {
      const rect = item.getBoundingClientRect();
      // Calculate center based on current position
      const itemCenterX = rect.left + (rect.width / 2);
      
      const dist = Math.abs(this.mouseX - itemCenterX);
      
      let newSize = this.options.baseItemSize;
      if (dist < this.options.distance) {
        // Create a bell curve (cosine interpolation) for the magnification
        // dist 0 = 1, dist options.distance = 0
        const scale = Math.cos((dist / this.options.distance) * (Math.PI / 2));
        newSize = this.options.baseItemSize + (this.options.magnification - this.options.baseItemSize) * scale;
      }

      item.style.setProperty('--dock-item-size', `${newSize}px`);
      
      // Keep track of the tallest item to expand the dock panel upwards
      // + 20 for bottom padding + border
      if (newSize + 20 > maxHeightSeen) {
        maxHeightSeen = newSize + 20;
      }
    });

    this.element.style.height = `${maxHeightSeen}px`;
  }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
  const dockEl = document.querySelector('.mac-dock-container');
  if (dockEl) {
    new MacDock(dockEl);
  }
});
