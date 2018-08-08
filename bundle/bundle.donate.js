'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * A component handler interface using the revealing module design pattern.
 * More details on this design pattern here:
 * https://github.com/jasonmayes/mdl-component-design-pattern
 *
 * @author Jason Mayes
 */
/* exported componentHandler */

// Pre-defining the componentHandler interface, for closure documentation and
// static verification.
var componentHandler = {
  /**
   * Searches existing DOM for elements of our component type and upgrades them
   * if they have not already been upgraded.
   *
   * @param {string=} optJsClass the programatic name of the element class we
   * need to create a new instance of.
   * @param {string=} optCssClass the name of the CSS class elements of this
   * type will have.
   */
  upgradeDom: function upgradeDom(optJsClass, optCssClass) {},
  /**
   * Upgrades a specific element rather than all in the DOM.
   *
   * @param {!Element} element The element we wish to upgrade.
   * @param {string=} optJsClass Optional name of the class we want to upgrade
   * the element to.
   */
  upgradeElement: function upgradeElement(element, optJsClass) {},
  /**
   * Upgrades a specific list of elements rather than all in the DOM.
   *
   * @param {!Element|!Array<!Element>|!NodeList|!HTMLCollection} elements
   * The elements we wish to upgrade.
   */
  upgradeElements: function upgradeElements(elements) {},
  /**
   * Upgrades all registered components found in the current DOM. This is
   * automatically called on window load.
   */
  upgradeAllRegistered: function upgradeAllRegistered() {},
  /**
   * Allows user to be alerted to any upgrades that are performed for a given
   * component type
   *
   * @param {string} jsClass The class name of the MDL component we wish
   * to hook into for any upgrades performed.
   * @param {function(!HTMLElement)} callback The function to call upon an
   * upgrade. This function should expect 1 parameter - the HTMLElement which
   * got upgraded.
   */
  registerUpgradedCallback: function registerUpgradedCallback(jsClass, callback) {},
  /**
   * Registers a class for future use and attempts to upgrade existing DOM.
   *
   * @param {componentHandler.ComponentConfigPublic} config the registration configuration
   */
  register: function register(config) {},
  /**
   * Downgrade either a given node, an array of nodes, or a NodeList.
   *
   * @param {!Node|!Array<!Node>|!NodeList} nodes
   */
  downgradeElements: function downgradeElements(nodes) {}
};

componentHandler = function () {
  'use strict';

  /** @type {!Array<componentHandler.ComponentConfig>} */

  var registeredComponents_ = [];

  /** @type {!Array<componentHandler.Component>} */
  var createdComponents_ = [];

  var componentConfigProperty_ = 'mdlComponentConfigInternal_';

  /**
   * Searches registered components for a class we are interested in using.
   * Optionally replaces a match with passed object if specified.
   *
   * @param {string} name The name of a class we want to use.
   * @param {componentHandler.ComponentConfig=} optReplace Optional object to replace match with.
   * @return {!Object|boolean}
   * @private
   */
  function findRegisteredClass_(name, optReplace) {
    for (var i = 0; i < registeredComponents_.length; i++) {
      if (registeredComponents_[i].className === name) {
        if (typeof optReplace !== 'undefined') {
          registeredComponents_[i] = optReplace;
        }
        return registeredComponents_[i];
      }
    }
    return false;
  }

  /**
   * Returns an array of the classNames of the upgraded classes on the element.
   *
   * @param {!Element} element The element to fetch data from.
   * @return {!Array<string>}
   * @private
   */
  function getUpgradedListOfElement_(element) {
    var dataUpgraded = element.getAttribute('data-upgraded');
    // Use `['']` as default value to conform the `,name,name...` style.
    return dataUpgraded === null ? [''] : dataUpgraded.split(',');
  }

  /**
   * Returns true if the given element has already been upgraded for the given
   * class.
   *
   * @param {!Element} element The element we want to check.
   * @param {string} jsClass The class to check for.
   * @returns {boolean}
   * @private
   */
  function isElementUpgraded_(element, jsClass) {
    var upgradedList = getUpgradedListOfElement_(element);
    return upgradedList.indexOf(jsClass) !== -1;
  }

  /**
   * Create an event object.
   *
   * @param {string} eventType The type name of the event.
   * @param {boolean} bubbles Whether the event should bubble up the DOM.
   * @param {boolean} cancelable Whether the event can be canceled.
   * @returns {!Event}
   */
  function createEvent_(eventType, bubbles, cancelable) {
    if ('CustomEvent' in window && typeof window.CustomEvent === 'function') {
      return new CustomEvent(eventType, {
        bubbles: bubbles,
        cancelable: cancelable
      });
    } else {
      var ev = document.createEvent('Events');
      ev.initEvent(eventType, bubbles, cancelable);
      return ev;
    }
  }

  /**
   * Searches existing DOM for elements of our component type and upgrades them
   * if they have not already been upgraded.
   *
   * @param {string=} optJsClass the programatic name of the element class we
   * need to create a new instance of.
   * @param {string=} optCssClass the name of the CSS class elements of this
   * type will have.
   */
  function upgradeDomInternal(optJsClass, optCssClass) {
    if (typeof optJsClass === 'undefined' && typeof optCssClass === 'undefined') {
      for (var i = 0; i < registeredComponents_.length; i++) {
        upgradeDomInternal(registeredComponents_[i].className, registeredComponents_[i].cssClass);
      }
    } else {
      var jsClass = /** @type {string} */optJsClass;
      if (typeof optCssClass === 'undefined') {
        var registeredClass = findRegisteredClass_(jsClass);
        if (registeredClass) {
          optCssClass = registeredClass.cssClass;
        }
      }

      var elements = document.querySelectorAll('.' + optCssClass);
      for (var n = 0; n < elements.length; n++) {
        upgradeElementInternal(elements[n], jsClass);
      }
    }
  }

  /**
   * Upgrades a specific element rather than all in the DOM.
   *
   * @param {!Element} element The element we wish to upgrade.
   * @param {string=} optJsClass Optional name of the class we want to upgrade
   * the element to.
   */
  function upgradeElementInternal(element, optJsClass) {
    // Verify argument type.
    if (!((typeof element === 'undefined' ? 'undefined' : _typeof(element)) === 'object' && element instanceof Element)) {
      throw new Error('Invalid argument provided to upgrade MDL element.');
    }
    // Allow upgrade to be canceled by canceling emitted event.
    var upgradingEv = createEvent_('mdl-componentupgrading', true, true);
    element.dispatchEvent(upgradingEv);
    if (upgradingEv.defaultPrevented) {
      return;
    }

    var upgradedList = getUpgradedListOfElement_(element);
    var classesToUpgrade = [];
    // If jsClass is not provided scan the registered components to find the
    // ones matching the element's CSS classList.
    if (!optJsClass) {
      var classList = element.classList;
      registeredComponents_.forEach(function (component) {
        // Match CSS & Not to be upgraded & Not upgraded.
        if (classList.contains(component.cssClass) && classesToUpgrade.indexOf(component) === -1 && !isElementUpgraded_(element, component.className)) {
          classesToUpgrade.push(component);
        }
      });
    } else if (!isElementUpgraded_(element, optJsClass)) {
      classesToUpgrade.push(findRegisteredClass_(optJsClass));
    }

    // Upgrade the element for each classes.
    for (var i = 0, n = classesToUpgrade.length, registeredClass; i < n; i++) {
      registeredClass = classesToUpgrade[i];
      if (registeredClass) {
        // Mark element as upgraded.
        upgradedList.push(registeredClass.className);
        element.setAttribute('data-upgraded', upgradedList.join(','));
        var instance = new registeredClass.classConstructor(element);
        instance[componentConfigProperty_] = registeredClass;
        createdComponents_.push(instance);
        // Call any callbacks the user has registered with this component type.
        for (var j = 0, m = registeredClass.callbacks.length; j < m; j++) {
          registeredClass.callbacks[j](element);
        }

        if (registeredClass.widget) {
          // Assign per element instance for control over API
          element[registeredClass.className] = instance;
        }
      } else {
        throw new Error('Unable to find a registered component for the given class.');
      }

      var upgradedEv = createEvent_('mdl-componentupgraded', true, false);
      element.dispatchEvent(upgradedEv);
    }
  }

  /**
   * Upgrades a specific list of elements rather than all in the DOM.
   *
   * @param {!Element|!Array<!Element>|!NodeList|!HTMLCollection} elements
   * The elements we wish to upgrade.
   */
  function upgradeElementsInternal(elements) {
    if (!Array.isArray(elements)) {
      if (elements instanceof Element) {
        elements = [elements];
      } else {
        elements = Array.prototype.slice.call(elements);
      }
    }
    for (var i = 0, n = elements.length, element; i < n; i++) {
      element = elements[i];
      if (element instanceof HTMLElement) {
        upgradeElementInternal(element);
        if (element.children.length > 0) {
          upgradeElementsInternal(element.children);
        }
      }
    }
  }

  /**
   * Registers a class for future use and attempts to upgrade existing DOM.
   *
   * @param {componentHandler.ComponentConfigPublic} config
   */
  function registerInternal(config) {
    // In order to support both Closure-compiled and uncompiled code accessing
    // this method, we need to allow for both the dot and array syntax for
    // property access. You'll therefore see the `foo.bar || foo['bar']`
    // pattern repeated across this method.
    var widgetMissing = typeof config.widget === 'undefined' && typeof config['widget'] === 'undefined';
    var widget = true;

    if (!widgetMissing) {
      widget = config.widget || config['widget'];
    }

    var newConfig = /** @type {componentHandler.ComponentConfig} */{
      classConstructor: config.constructor || config['constructor'],
      className: config.classAsString || config['classAsString'],
      cssClass: config.cssClass || config['cssClass'],
      widget: widget,
      callbacks: []
    };

    registeredComponents_.forEach(function (item) {
      if (item.cssClass === newConfig.cssClass) {
        throw new Error('The provided cssClass has already been registered: ' + item.cssClass);
      }
      if (item.className === newConfig.className) {
        throw new Error('The provided className has already been registered');
      }
    });

    if (config.constructor.prototype.hasOwnProperty(componentConfigProperty_)) {
      throw new Error('MDL component classes must not have ' + componentConfigProperty_ + ' defined as a property.');
    }

    var found = findRegisteredClass_(config.classAsString, newConfig);

    if (!found) {
      registeredComponents_.push(newConfig);
    }
  }

  /**
   * Allows user to be alerted to any upgrades that are performed for a given
   * component type
   *
   * @param {string} jsClass The class name of the MDL component we wish
   * to hook into for any upgrades performed.
   * @param {function(!HTMLElement)} callback The function to call upon an
   * upgrade. This function should expect 1 parameter - the HTMLElement which
   * got upgraded.
   */
  function registerUpgradedCallbackInternal(jsClass, callback) {
    var regClass = findRegisteredClass_(jsClass);
    if (regClass) {
      regClass.callbacks.push(callback);
    }
  }

  /**
   * Upgrades all registered components found in the current DOM. This is
   * automatically called on window load.
   */
  function upgradeAllRegisteredInternal() {
    for (var n = 0; n < registeredComponents_.length; n++) {
      upgradeDomInternal(registeredComponents_[n].className);
    }
  }

  /**
   * Check the component for the downgrade method.
   * Execute if found.
   * Remove component from createdComponents list.
   *
   * @param {?componentHandler.Component} component
   */
  function deconstructComponentInternal(component) {
    if (component) {
      var componentIndex = createdComponents_.indexOf(component);
      createdComponents_.splice(componentIndex, 1);

      var upgrades = component.element_.getAttribute('data-upgraded').split(',');
      var componentPlace = upgrades.indexOf(component[componentConfigProperty_].classAsString);
      upgrades.splice(componentPlace, 1);
      component.element_.setAttribute('data-upgraded', upgrades.join(','));

      var ev = createEvent_('mdl-componentdowngraded', true, false);
      component.element_.dispatchEvent(ev);
    }
  }

  /**
   * Downgrade either a given node, an array of nodes, or a NodeList.
   *
   * @param {!Node|!Array<!Node>|!NodeList} nodes
   */
  function downgradeNodesInternal(nodes) {
    /**
     * Auxiliary function to downgrade a single node.
     * @param  {!Node} node the node to be downgraded
     */
    var downgradeNode = function downgradeNode(node) {
      createdComponents_.filter(function (item) {
        return item.element_ === node;
      }).forEach(deconstructComponentInternal);
    };
    if (nodes instanceof Array || nodes instanceof NodeList) {
      for (var n = 0; n < nodes.length; n++) {
        downgradeNode(nodes[n]);
      }
    } else if (nodes instanceof Node) {
      downgradeNode(nodes);
    } else {
      throw new Error('Invalid argument provided to downgrade MDL nodes.');
    }
  }

  // Now return the functions that should be made public with their publicly
  // facing names...
  return {
    upgradeDom: upgradeDomInternal,
    upgradeElement: upgradeElementInternal,
    upgradeElements: upgradeElementsInternal,
    upgradeAllRegistered: upgradeAllRegisteredInternal,
    registerUpgradedCallback: registerUpgradedCallbackInternal,
    register: registerInternal,
    downgradeElements: downgradeNodesInternal
  };
}();

/**
 * Describes the type of a registered component type managed by
 * componentHandler. Provided for benefit of the Closure compiler.
 *
 * @typedef {{
 *   constructor: Function,
 *   classAsString: string,
 *   cssClass: string,
 *   widget: (string|boolean|undefined)
 * }}
 */
componentHandler.ComponentConfigPublic; // jshint ignore:line

/**
 * Describes the type of a registered component type managed by
 * componentHandler. Provided for benefit of the Closure compiler.
 *
 * @typedef {{
 *   constructor: !Function,
 *   className: string,
 *   cssClass: string,
 *   widget: (string|boolean),
 *   callbacks: !Array<function(!HTMLElement)>
 * }}
 */
componentHandler.ComponentConfig; // jshint ignore:line

/**
 * Created component (i.e., upgraded element) type as managed by
 * componentHandler. Provided for benefit of the Closure compiler.
 *
 * @typedef {{
 *   element_: !HTMLElement,
 *   className: string,
 *   classAsString: string,
 *   cssClass: string,
 *   widget: string
 * }}
 */
componentHandler.Component; // jshint ignore:line

// Export all symbols, for the benefit of Closure compiler.
// No effect on uncompiled code.
componentHandler['upgradeDom'] = componentHandler.upgradeDom;
componentHandler['upgradeElement'] = componentHandler.upgradeElement;
componentHandler['upgradeElements'] = componentHandler.upgradeElements;
componentHandler['upgradeAllRegistered'] = componentHandler.upgradeAllRegistered;
componentHandler['registerUpgradedCallback'] = componentHandler.registerUpgradedCallback;
componentHandler['register'] = componentHandler.register;
componentHandler['downgradeElements'] = componentHandler.downgradeElements;
window.componentHandler = componentHandler;
window['componentHandler'] = componentHandler;

window.addEventListener('load', function () {
  'use strict';

  /**
   * Performs a "Cutting the mustard" test. If the browser supports the features
   * tested, adds a mdl-js class to the <html> element. It then upgrades all MDL
   * components requiring JavaScript.
   */

  if ('classList' in document.createElement('div') && 'querySelector' in document && 'addEventListener' in window && Array.prototype.forEach) {
    document.documentElement.classList.add('mdl-js');
    componentHandler.upgradeAllRegistered();
  } else {
    /**
     * Dummy function to avoid JS errors.
     */
    componentHandler.upgradeElement = function () {};
    /**
     * Dummy function to avoid JS errors.
     */
    componentHandler.register = function () {};
  }
});
'use strict';

/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

(function () {
  'use strict';

  /**
   * Class constructor for Button MDL component.
   * Implements MDL component design pattern defined at:
   * https://github.com/jasonmayes/mdl-component-design-pattern
   *
   * @param {HTMLElement} element The element that will be upgraded.
   */

  var MaterialButton = function MaterialButton(element) {
    this.element_ = element;

    // Initialize instance.
    this.init();
  };
  window['MaterialButton'] = MaterialButton;

  /**
   * Store constants in one place so they can be updated easily.
   *
   * @enum {string | number}
   * @private
   */
  MaterialButton.prototype.Constant_ = {
    // None for now.
  };

  /**
   * Store strings for class names defined by this component that are used in
   * JavaScript. This allows us to simply change it in one place should we
   * decide to modify at a later date.
   *
   * @enum {string}
   * @private
   */
  MaterialButton.prototype.CssClasses_ = {
    RIPPLE_EFFECT: 'mdl-js-ripple-effect',
    RIPPLE_CONTAINER: 'mdl-button__ripple-container',
    RIPPLE: 'mdl-ripple'
  };

  /**
   * Handle blur of element.
   *
   * @param {Event} event The event that fired.
   * @private
   */
  MaterialButton.prototype.blurHandler_ = function (event) {
    if (event) {
      this.element_.blur();
    }
  };

  // Public methods.

  /**
   * Disable button.
   *
   * @public
   */
  MaterialButton.prototype.disable = function () {
    this.element_.disabled = true;
  };
  MaterialButton.prototype['disable'] = MaterialButton.prototype.disable;

  /**
   * Enable button.
   *
   * @public
   */
  MaterialButton.prototype.enable = function () {
    this.element_.disabled = false;
  };
  MaterialButton.prototype['enable'] = MaterialButton.prototype.enable;

  /**
   * Initialize element.
   */
  MaterialButton.prototype.init = function () {
    if (this.element_) {
      if (this.element_.classList.contains(this.CssClasses_.RIPPLE_EFFECT)) {
        var rippleContainer = document.createElement('span');
        rippleContainer.classList.add(this.CssClasses_.RIPPLE_CONTAINER);
        this.rippleElement_ = document.createElement('span');
        this.rippleElement_.classList.add(this.CssClasses_.RIPPLE);
        rippleContainer.appendChild(this.rippleElement_);
        this.boundRippleBlurHandler = this.blurHandler_.bind(this);
        this.rippleElement_.addEventListener('mouseup', this.boundRippleBlurHandler);
        this.element_.appendChild(rippleContainer);
      }
      this.boundButtonBlurHandler = this.blurHandler_.bind(this);
      this.element_.addEventListener('mouseup', this.boundButtonBlurHandler);
      this.element_.addEventListener('mouseleave', this.boundButtonBlurHandler);
    }
  };

  // The component registers itself. It can assume componentHandler is available
  // in the global scope.
  componentHandler.register({
    constructor: MaterialButton,
    classAsString: 'MaterialButton',
    cssClass: 'mdl-js-button',
    widget: true
  });
})();
'use strict';

/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

(function () {
  'use strict';

  /**
   * Class constructor for Ripple MDL component.
   * Implements MDL component design pattern defined at:
   * https://github.com/jasonmayes/mdl-component-design-pattern
   *
   * @constructor
   * @param {HTMLElement} element The element that will be upgraded.
   */

  var MaterialRipple = function MaterialRipple(element) {
    this.element_ = element;

    // Initialize instance.
    this.init();
  };
  window['MaterialRipple'] = MaterialRipple;

  /**
   * Store constants in one place so they can be updated easily.
   *
   * @enum {string | number}
   * @private
   */
  MaterialRipple.prototype.Constant_ = {
    INITIAL_SCALE: 'scale(0.0001, 0.0001)',
    INITIAL_SIZE: '1px',
    INITIAL_OPACITY: '0.4',
    FINAL_OPACITY: '0',
    FINAL_SCALE: ''
  };

  /**
   * Store strings for class names defined by this component that are used in
   * JavaScript. This allows us to simply change it in one place should we
   * decide to modify at a later date.
   *
   * @enum {string}
   * @private
   */
  MaterialRipple.prototype.CssClasses_ = {
    RIPPLE_CENTER: 'mdl-ripple--center',
    RIPPLE_EFFECT_IGNORE_EVENTS: 'mdl-js-ripple-effect--ignore-events',
    RIPPLE: 'mdl-ripple',
    IS_ANIMATING: 'is-animating',
    IS_VISIBLE: 'is-visible'
  };

  /**
   * Handle mouse / finger down on element.
   *
   * @param {Event} event The event that fired.
   * @private
   */
  MaterialRipple.prototype.downHandler_ = function (event) {
    if (!this.rippleElement_.style.width && !this.rippleElement_.style.height) {
      var rect = this.element_.getBoundingClientRect();
      this.boundHeight = rect.height;
      this.boundWidth = rect.width;
      this.rippleSize_ = Math.sqrt(rect.width * rect.width + rect.height * rect.height) * 2 + 2;
      this.rippleElement_.style.width = this.rippleSize_ + 'px';
      this.rippleElement_.style.height = this.rippleSize_ + 'px';
    }

    this.rippleElement_.classList.add(this.CssClasses_.IS_VISIBLE);

    if (event.type === 'mousedown' && this.ignoringMouseDown_) {
      this.ignoringMouseDown_ = false;
    } else {
      if (event.type === 'touchstart') {
        this.ignoringMouseDown_ = true;
      }
      var frameCount = this.getFrameCount();
      if (frameCount > 0) {
        return;
      }
      this.setFrameCount(1);
      var bound = event.currentTarget.getBoundingClientRect();
      var x;
      var y;
      // Check if we are handling a keyboard click.
      if (event.clientX === 0 && event.clientY === 0) {
        x = Math.round(bound.width / 2);
        y = Math.round(bound.height / 2);
      } else {
        var clientX = event.clientX !== undefined ? event.clientX : event.touches[0].clientX;
        var clientY = event.clientY !== undefined ? event.clientY : event.touches[0].clientY;
        x = Math.round(clientX - bound.left);
        y = Math.round(clientY - bound.top);
      }
      this.setRippleXY(x, y);
      this.setRippleStyles(true);
      window.requestAnimationFrame(this.animFrameHandler.bind(this));
    }
  };

  /**
   * Handle mouse / finger up on element.
   *
   * @param {Event} event The event that fired.
   * @private
   */
  MaterialRipple.prototype.upHandler_ = function (event) {
    // Don't fire for the artificial "mouseup" generated by a double-click.
    if (event && event.detail !== 2) {
      // Allow a repaint to occur before removing this class, so the animation
      // shows for tap events, which seem to trigger a mouseup too soon after
      // mousedown.
      window.setTimeout(function () {
        this.rippleElement_.classList.remove(this.CssClasses_.IS_VISIBLE);
      }.bind(this), 0);
    }
  };

  /**
   * Initialize element.
   */
  MaterialRipple.prototype.init = function () {
    if (this.element_) {
      var recentering = this.element_.classList.contains(this.CssClasses_.RIPPLE_CENTER);
      if (!this.element_.classList.contains(this.CssClasses_.RIPPLE_EFFECT_IGNORE_EVENTS)) {
        this.rippleElement_ = this.element_.querySelector('.' + this.CssClasses_.RIPPLE);
        this.frameCount_ = 0;
        this.rippleSize_ = 0;
        this.x_ = 0;
        this.y_ = 0;

        // Touch start produces a compat mouse down event, which would cause a
        // second ripples. To avoid that, we use this property to ignore the first
        // mouse down after a touch start.
        this.ignoringMouseDown_ = false;

        this.boundDownHandler = this.downHandler_.bind(this);
        this.element_.addEventListener('mousedown', this.boundDownHandler);
        this.element_.addEventListener('touchstart', this.boundDownHandler);

        this.boundUpHandler = this.upHandler_.bind(this);
        this.element_.addEventListener('mouseup', this.boundUpHandler);
        this.element_.addEventListener('mouseleave', this.boundUpHandler);
        this.element_.addEventListener('touchend', this.boundUpHandler);
        this.element_.addEventListener('blur', this.boundUpHandler);

        /**
         * Getter for frameCount_.
         * @return {number} the frame count.
         */
        this.getFrameCount = function () {
          return this.frameCount_;
        };

        /**
         * Setter for frameCount_.
         * @param {number} fC the frame count.
         */
        this.setFrameCount = function (fC) {
          this.frameCount_ = fC;
        };

        /**
         * Getter for rippleElement_.
         * @return {Element} the ripple element.
         */
        this.getRippleElement = function () {
          return this.rippleElement_;
        };

        /**
         * Sets the ripple X and Y coordinates.
         * @param  {number} newX the new X coordinate
         * @param  {number} newY the new Y coordinate
         */
        this.setRippleXY = function (newX, newY) {
          this.x_ = newX;
          this.y_ = newY;
        };

        /**
         * Sets the ripple styles.
         * @param  {boolean} start whether or not this is the start frame.
         */
        this.setRippleStyles = function (start) {
          if (this.rippleElement_ !== null) {
            var transformString;
            var scale;
            var size;
            var offset = 'translate(' + this.x_ + 'px, ' + this.y_ + 'px)';

            if (start) {
              scale = this.Constant_.INITIAL_SCALE;
              size = this.Constant_.INITIAL_SIZE;
            } else {
              scale = this.Constant_.FINAL_SCALE;
              size = this.rippleSize_ + 'px';
              if (recentering) {
                offset = 'translate(' + this.boundWidth / 2 + 'px, ' + this.boundHeight / 2 + 'px)';
              }
            }

            transformString = 'translate(-50%, -50%) ' + offset + scale;

            this.rippleElement_.style.webkitTransform = transformString;
            this.rippleElement_.style.msTransform = transformString;
            this.rippleElement_.style.transform = transformString;

            if (start) {
              this.rippleElement_.classList.remove(this.CssClasses_.IS_ANIMATING);
            } else {
              this.rippleElement_.classList.add(this.CssClasses_.IS_ANIMATING);
            }
          }
        };

        /**
         * Handles an animation frame.
         */
        this.animFrameHandler = function () {
          if (this.frameCount_-- > 0) {
            window.requestAnimationFrame(this.animFrameHandler.bind(this));
          } else {
            this.setRippleStyles(false);
          }
        };
      }
    }
  };

  // The component registers itself. It can assume componentHandler is available
  // in the global scope.
  componentHandler.register({
    constructor: MaterialRipple,
    classAsString: 'MaterialRipple',
    cssClass: 'mdl-js-ripple-effect',
    widget: false
  });
})();
'use strict';

/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

(function () {
  'use strict';

  /**
   * Class constructor for Slider MDL component.
   * Implements MDL component design pattern defined at:
   * https://github.com/jasonmayes/mdl-component-design-pattern
   *
   * @constructor
   * @param {HTMLElement} element The element that will be upgraded.
   */

  var MaterialSlider = function MaterialSlider(element) {
    this.element_ = element;
    // Browser feature detection.
    this.isIE_ = window.navigator.msPointerEnabled;
    // Initialize instance.
    this.init();
  };
  window['MaterialSlider'] = MaterialSlider;

  /**
   * Store constants in one place so they can be updated easily.
   *
   * @enum {string | number}
   * @private
   */
  MaterialSlider.prototype.Constant_ = {
    // None for now.
  };

  /**
   * Store strings for class names defined by this component that are used in
   * JavaScript. This allows us to simply change it in one place should we
   * decide to modify at a later date.
   *
   * @enum {string}
   * @private
   */
  MaterialSlider.prototype.CssClasses_ = {
    IE_CONTAINER: 'mdl-slider__ie-container',
    SLIDER_CONTAINER: 'mdl-slider__container',
    BACKGROUND_FLEX: 'mdl-slider__background-flex',
    BACKGROUND_LOWER: 'mdl-slider__background-lower',
    BACKGROUND_UPPER: 'mdl-slider__background-upper',
    IS_LOWEST_VALUE: 'is-lowest-value',
    IS_UPGRADED: 'is-upgraded'
  };

  /**
   * Handle input on element.
   *
   * @param {Event} event The event that fired.
   * @private
   */
  MaterialSlider.prototype.onInput_ = function (event) {
    this.updateValueStyles_();
  };

  /**
   * Handle change on element.
   *
   * @param {Event} event The event that fired.
   * @private
   */
  MaterialSlider.prototype.onChange_ = function (event) {
    this.updateValueStyles_();
  };

  /**
   * Handle mouseup on element.
   *
   * @param {Event} event The event that fired.
   * @private
   */
  MaterialSlider.prototype.onMouseUp_ = function (event) {
    event.target.blur();
  };

  /**
   * Handle mousedown on container element.
   * This handler is purpose is to not require the use to click
   * exactly on the 2px slider element, as FireFox seems to be very
   * strict about this.
   *
   * @param {Event} event The event that fired.
   * @private
   * @suppress {missingProperties}
   */
  MaterialSlider.prototype.onContainerMouseDown_ = function (event) {
    // If this click is not on the parent element (but rather some child)
    // ignore. It may still bubble up.
    if (event.target !== this.element_.parentElement) {
      return;
    }

    // Discard the original event and create a new event that
    // is on the slider element.
    event.preventDefault();
    var newEvent = new MouseEvent('mousedown', {
      target: event.target,
      buttons: event.buttons,
      clientX: event.clientX,
      clientY: this.element_.getBoundingClientRect().y
    });
    this.element_.dispatchEvent(newEvent);
  };

  /**
   * Handle updating of values.
   *
   * @private
   */
  MaterialSlider.prototype.updateValueStyles_ = function () {
    // Calculate and apply percentages to div structure behind slider.
    var fraction = (this.element_.value - this.element_.min) / (this.element_.max - this.element_.min);

    if (fraction === 0) {
      this.element_.classList.add(this.CssClasses_.IS_LOWEST_VALUE);
    } else {
      this.element_.classList.remove(this.CssClasses_.IS_LOWEST_VALUE);
    }

    if (!this.isIE_) {
      this.backgroundLower_.style.flex = fraction;
      this.backgroundLower_.style.webkitFlex = fraction;
      this.backgroundUpper_.style.flex = 1 - fraction;
      this.backgroundUpper_.style.webkitFlex = 1 - fraction;
    }
  };

  // Public methods.

  /**
   * Disable slider.
   *
   * @public
   */
  MaterialSlider.prototype.disable = function () {
    this.element_.disabled = true;
  };
  MaterialSlider.prototype['disable'] = MaterialSlider.prototype.disable;

  /**
   * Enable slider.
   *
   * @public
   */
  MaterialSlider.prototype.enable = function () {

    this.element_.disabled = false;
  };
  MaterialSlider.prototype['enable'] = MaterialSlider.prototype.enable;

  /**
   * Update slider value.
   *
   * @param {number} value The value to which to set the control (optional).
   * @public
   */
  MaterialSlider.prototype.change = function (value) {

    if (typeof value !== 'undefined') {
      this.element_.value = value;
    }
    this.updateValueStyles_();
  };
  MaterialSlider.prototype['change'] = MaterialSlider.prototype.change;

  /**
   * Initialize element.
   */
  MaterialSlider.prototype.init = function () {

    if (this.element_) {
      if (this.isIE_) {
        // Since we need to specify a very large height in IE due to
        // implementation limitations, we add a parent here that trims it down to
        // a reasonable size.
        var containerIE = document.createElement('div');
        containerIE.classList.add(this.CssClasses_.IE_CONTAINER);
        this.element_.parentElement.insertBefore(containerIE, this.element_);
        this.element_.parentElement.removeChild(this.element_);
        containerIE.appendChild(this.element_);
      } else {
        // For non-IE browsers, we need a div structure that sits behind the
        // slider and allows us to style the left and right sides of it with
        // different colors.
        var container = document.createElement('div');
        container.classList.add(this.CssClasses_.SLIDER_CONTAINER);
        this.element_.parentElement.insertBefore(container, this.element_);
        this.element_.parentElement.removeChild(this.element_);
        container.appendChild(this.element_);
        var backgroundFlex = document.createElement('div');
        backgroundFlex.classList.add(this.CssClasses_.BACKGROUND_FLEX);
        container.appendChild(backgroundFlex);
        this.backgroundLower_ = document.createElement('div');
        this.backgroundLower_.classList.add(this.CssClasses_.BACKGROUND_LOWER);
        backgroundFlex.appendChild(this.backgroundLower_);
        this.backgroundUpper_ = document.createElement('div');
        this.backgroundUpper_.classList.add(this.CssClasses_.BACKGROUND_UPPER);
        backgroundFlex.appendChild(this.backgroundUpper_);
      }

      this.boundInputHandler = this.onInput_.bind(this);
      this.boundChangeHandler = this.onChange_.bind(this);
      this.boundMouseUpHandler = this.onMouseUp_.bind(this);
      this.boundContainerMouseDownHandler = this.onContainerMouseDown_.bind(this);
      this.element_.addEventListener('input', this.boundInputHandler);
      this.element_.addEventListener('change', this.boundChangeHandler);
      this.element_.addEventListener('mouseup', this.boundMouseUpHandler);
      this.element_.parentElement.addEventListener('mousedown', this.boundContainerMouseDownHandler);

      this.updateValueStyles_();
      this.element_.classList.add(this.CssClasses_.IS_UPGRADED);
    }
  };

  // The component registers itself. It can assume componentHandler is available
  // in the global scope.
  componentHandler.register({
    constructor: MaterialSlider,
    classAsString: 'MaterialSlider',
    cssClass: 'mdl-js-slider',
    widget: true
  });
})();
'use strict';

(function () {
  'use strict';

  /**
   * Class constructor for Select field MDL component.
   * Implements custom MDL component design pattern not defined yet.
   *
   * @constructor
   * @param {HTMLElement} element The element that will be upgraded.
   */

  var MaterialSelectfield = function MaterialSelectfield(element) {
    this.element_ = element;
    // Initialize instance.
    this.init();
  };
  window['MaterialSelectfield'] = MaterialSelectfield;

  MaterialSelectfield.prototype.Constant_ = {
    // None for now
  };

  MaterialSelectfield.prototype.CssClasses_ = {
    LABEL: 'mdl-selectfield__label',
    SELECT: 'mdl-selectfield__select',
    IS_DIRTY: 'is-dirty',
    IS_FOCUSED: 'is-focused',
    IS_DISABLED: 'is-disabled',
    IS_INVALID: 'is-invalid',
    IS_UPGRADED: 'is-upgraded'
  };

  /**
   * Handle focus.
   *
   * @param {Event} event The event that fired.
   * @private
   */
  MaterialSelectfield.prototype.onFocus_ = function (event) {
    this.element_.classList.add(this.CssClasses_.IS_FOCUSED);
  };

  /**
   * Handle lost focus.
   *
   * @param {Event} event The event that fired.
   * @private
   */
  MaterialSelectfield.prototype.onBlur_ = function (event) {
    this.element_.classList.remove(this.CssClasses_.IS_FOCUSED);
  };

  /**
   * Handle reset event from outside.
   *
   * @param {Event} event The event that fired.
   * @private
   */
  MaterialSelectfield.prototype.onReset_ = function (event) {
    this.updateClasses_();
  };

  /**
   * Handle class updates.
   *
   * @private
   */
  MaterialSelectfield.prototype.updateClasses_ = function () {
    this.checkDisabled();
    this.checkValidity();
    this.checkDirty();
  };

  // Public methods.

  /**
   * Check the disabled state and update field accordingly.
   *
   * @public
   */
  MaterialSelectfield.prototype.checkDisabled = function () {
    if (this.select_.disabled) {
      this.element_.classList.add(this.CssClasses_.IS_DISABLED);
    } else {
      this.element_.classList.remove(this.CssClasses_.IS_DISABLED);
    }
  };
  MaterialSelectfield.prototype['checkDisabled'] = MaterialSelectfield.prototype.checkDisabled;

  /**
   * Check the validity state and update field accordingly.
   *
   * @public
   */
  MaterialSelectfield.prototype.checkValidity = function () {
    if (this.select_.validity.valid) {
      this.element_.classList.remove(this.CssClasses_.IS_INVALID);
    } else {
      this.element_.classList.add(this.CssClasses_.IS_INVALID);
    }
  };
  MaterialSelectfield.prototype['checkValidity'] = MaterialSelectfield.prototype.checkValidity;

  /**
   * Check the dirty state and update field accordingly.
   *
   * @public
   */
  MaterialSelectfield.prototype.checkDirty = function () {
    if (this.select_.value && this.select_.value.length > 0) {
      this.element_.classList.add(this.CssClasses_.IS_DIRTY);
    } else {
      this.element_.classList.remove(this.CssClasses_.IS_DIRTY);
    }
  };
  MaterialSelectfield.prototype['checkDirty'] = MaterialSelectfield.prototype.checkDirty;

  /**
   * Enable select field.
   *
   * @public
   */
  MaterialSelectfield.prototype.disable = function () {
    this.select_.disabled = true;
    this.updateClasses_();
  };
  MaterialSelectfield.prototype['disable'] = MaterialSelectfield.prototype.disable;

  /**
   * Enable select field.
   *
   * @public
   */
  MaterialSelectfield.prototype.enable = function () {
    this.select_.disabled = false;
    this.updateClasses_();
  };
  MaterialSelectfield.prototype['enable'] = MaterialSelectfield.prototype.enable;

  /**
   * Update select field value.
   *
   * @param {string} value The value to which to set the control (optional).
   * @public
   */
  MaterialSelectfield.prototype.change = function (value) {
    if (value) {
      this.select_.value = value;
    }
    this.updateClasses_();
  };
  MaterialSelectfield.prototype['change'] = MaterialSelectfield.prototype.change;

  /**
   * Initialize element.
   */
  MaterialSelectfield.prototype.init = function () {
    if (this.element_) {
      this.label_ = this.element_.querySelector('.' + this.CssClasses_.LABEL);
      this.select_ = this.element_.querySelector('.' + this.CssClasses_.SELECT);

      if (this.select_) {
        this.boundUpdateClassesHandler = this.updateClasses_.bind(this);
        this.boundFocusHandler = this.onFocus_.bind(this);
        this.boundBlurHandler = this.onBlur_.bind(this);
        this.boundResetHandler = this.onReset_.bind(this);
        this.select_.addEventListener('change', this.boundUpdateClassesHandler);
        this.select_.addEventListener('focus', this.boundFocusHandler);
        this.select_.addEventListener('blur', this.boundBlurHandler);
        this.select_.addEventListener('reset', this.boundResetHandler);

        var invalid = this.element_.classList.contains(this.CssClasses_.IS_INVALID);
        this.updateClasses_();
        this.element_.classList.add(this.CssClasses_.IS_UPGRADED);
        if (invalid) {
          this.element_.classList.add(this.CssClasses_.IS_INVALID);
        }
      }
    }
  };

  /**
   * Downgrade the component
   *
   * @private
   */
  MaterialSelectfield.prototype.mdlDowngrade_ = function () {
    this.select_.removeEventListener('change', this.boundUpdateClassesHandler);
    this.select_.removeEventListener('focus', this.boundFocusHandler);
    this.select_.removeEventListener('blur', this.boundBlurHandler);
    this.select_.removeEventListener('reset', this.boundResetHandler);
  };

  // The component registers itself. It can assume componentHandler is available
  // in the global scope.
  componentHandler.register({
    constructor: MaterialSelectfield,
    classAsString: 'MaterialSelectfield',
    cssClass: 'mdl-js-selectfield',
    widget: true
  });
})();
'use strict';

/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

(function () {
  'use strict';

  /**
   * Class constructor for Spinner MDL component.
   * Implements MDL component design pattern defined at:
   * https://github.com/jasonmayes/mdl-component-design-pattern
   *
   * @param {HTMLElement} element The element that will be upgraded.
   * @constructor
   */

  var MaterialSpinner = function MaterialSpinner(element) {
    this.element_ = element;

    // Initialize instance.
    this.init();
  };
  window['MaterialSpinner'] = MaterialSpinner;

  /**
   * Store constants in one place so they can be updated easily.
   *
   * @enum {string | number}
   * @private
   */
  MaterialSpinner.prototype.Constant_ = {
    MDL_SPINNER_LAYER_COUNT: 4
  };

  /**
   * Store strings for class names defined by this component that are used in
   * JavaScript. This allows us to simply change it in one place should we
   * decide to modify at a later date.
   *
   * @enum {string}
   * @private
   */
  MaterialSpinner.prototype.CssClasses_ = {
    MDL_SPINNER_LAYER: 'mdl-spinner__layer',
    MDL_SPINNER_CIRCLE_CLIPPER: 'mdl-spinner__circle-clipper',
    MDL_SPINNER_CIRCLE: 'mdl-spinner__circle',
    MDL_SPINNER_GAP_PATCH: 'mdl-spinner__gap-patch',
    MDL_SPINNER_LEFT: 'mdl-spinner__left',
    MDL_SPINNER_RIGHT: 'mdl-spinner__right'
  };

  /**
   * Auxiliary method to create a spinner layer.
   *
   * @param {number} index Index of the layer to be created.
   * @public
   */
  MaterialSpinner.prototype.createLayer = function (index) {
    var layer = document.createElement('div');
    layer.classList.add(this.CssClasses_.MDL_SPINNER_LAYER);
    layer.classList.add(this.CssClasses_.MDL_SPINNER_LAYER + '-' + index);

    var leftClipper = document.createElement('div');
    leftClipper.classList.add(this.CssClasses_.MDL_SPINNER_CIRCLE_CLIPPER);
    leftClipper.classList.add(this.CssClasses_.MDL_SPINNER_LEFT);

    var gapPatch = document.createElement('div');
    gapPatch.classList.add(this.CssClasses_.MDL_SPINNER_GAP_PATCH);

    var rightClipper = document.createElement('div');
    rightClipper.classList.add(this.CssClasses_.MDL_SPINNER_CIRCLE_CLIPPER);
    rightClipper.classList.add(this.CssClasses_.MDL_SPINNER_RIGHT);

    var circleOwners = [leftClipper, gapPatch, rightClipper];

    for (var i = 0; i < circleOwners.length; i++) {
      var circle = document.createElement('div');
      circle.classList.add(this.CssClasses_.MDL_SPINNER_CIRCLE);
      circleOwners[i].appendChild(circle);
    }

    layer.appendChild(leftClipper);
    layer.appendChild(gapPatch);
    layer.appendChild(rightClipper);

    this.element_.appendChild(layer);
  };
  MaterialSpinner.prototype['createLayer'] = MaterialSpinner.prototype.createLayer;

  /**
   * Stops the spinner animation.
   * Public method for users who need to stop the spinner for any reason.
   *
   * @public
   */
  MaterialSpinner.prototype.stop = function () {
    this.element_.classList.remove('is-active');
  };
  MaterialSpinner.prototype['stop'] = MaterialSpinner.prototype.stop;

  /**
   * Starts the spinner animation.
   * Public method for users who need to manually start the spinner for any reason
   * (instead of just adding the 'is-active' class to their markup).
   *
   * @public
   */
  MaterialSpinner.prototype.start = function () {
    this.element_.classList.add('is-active');
  };
  MaterialSpinner.prototype['start'] = MaterialSpinner.prototype.start;

  /**
   * Initialize element.
   */
  MaterialSpinner.prototype.init = function () {
    if (this.element_) {
      for (var i = 1; i <= this.Constant_.MDL_SPINNER_LAYER_COUNT; i++) {
        this.createLayer(i);
      }

      this.element_.classList.add('is-upgraded');
    }
  };

  // The component registers itself. It can assume componentHandler is available
  // in the global scope.
  componentHandler.register({
    constructor: MaterialSpinner,
    classAsString: 'MaterialSpinner',
    cssClass: 'mdl-js-spinner',
    widget: true
  });
})();
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Donate = function () {
	function Donate() {
		_classCallCheck(this, Donate);

		this.amount = 10;
		this.lang = window.navigator.language.substr(0, 2).toLowerCase();
		this.currency = {
			"USD": {
				"symbol": "$",
				"min": 1,
				"max": 100,
				"amount": 10
			},
			"RUB": {
				"symbol": "₽",
				"min": 100,
				"max": 5000,
				"amount": 100
			},
			"EUR": {
				"symbol": "€",
				"min": 1,
				"max": 90,
				"amount": 8
			},
			"GBR": {
				"symbol": "£",
				"min": 1,
				"max": 70,
				"amount": 7
			},
			"AUD": {
				"symbol": "$",
				"min": 1,
				"max": 128,
				"amount": 13
			},
			"CAD": {
				"symbol": "$",
				"min": 1,
				"max": 128,
				"amount": 13
			},
			"JPY": {
				"symbol": "¥",
				"min": 105,
				"max": 10491,
				"amount": 1050
			},
			"TWD": {
				"symbol": "$",
				"min": 30,
				"max": 2920,
				"amount": 292
			}
		};
		this.code = "USD";
	}

	_createClass(Donate, [{
		key: "buildCurrency",
		value: function buildCurrency(select) {
			select = document.getElementById(select);

			for (var prop in this.currency) {
				var opt = document.createElement('option');
				opt.value = prop;
				opt.textContent = prop + ' ' + this.currency[prop].symbol;
				select.appendChild(opt);
			}
		}
	}, {
		key: "viewSum",
		value: function viewSum() {
			document.getElementById('amount_view').textContent = this.amount + this.currency[this.code].symbol;
		}
	}, {
		key: "setCode",
		value: function setCode(code) {
			this.code = code;
		}
	}, {
		key: "setAmount",
		value: function setAmount(amount) {
			this.amount = amount;
		}
	}, {
		key: "setRangeValue",
		value: function setRangeValue(input) {
			document.getElementById(input).value = this.amount;
		}
	}, {
		key: "setRangeCurrencyCode",
		value: function setRangeCurrencyCode(name) {
			document.getElementsByName(name)[0].value = this.code;
		}
	}, {
		key: "getMinMaxRange",
		value: function getMinMaxRange(input) {
			input = document.getElementById(input);

			if (input.min !== this.currency[this.code].min && input.max !== this.currency[this.code].max) {
				this.setAmount(this.currency[this.code].amount);
				this.setMinMaxRange(input);
			}
		}
	}, {
		key: "setMinMaxRange",
		value: function setMinMaxRange(input) {
			input = typeof input === 'string' ? document.getElementById(input) : input;
			input.min = this.currency[this.code].min;
			input.max = this.currency[this.code].max;
			this.setRangeValue('range');
			this.callCustomEvent('range', 'change');
		}
	}, {
		key: "changeRange",
		value: function changeRange(input) {
			var _this = this;

			document.getElementById(input).addEventListener('change', function (e) {
				if (e.isTrusted) {
					_this.setAmount(e.target.value);
				}
				_this.viewSum();
				document.getElementsByName('amount')[0].value = _this.amount;
				_this.changeFundingAmount(_this.amount);
			});
		}
	}, {
		key: "changeCurrency",
		value: function changeCurrency(select) {
			var _this2 = this;

			document.getElementById(select).addEventListener('change', function (e) {
				_this2.setCode(e.target.value);
				_this2.getMinMaxRange('range');
				_this2.setRangeCurrencyCode('currency_code');
				_this2.viewSum();
			});
		}
	}, {
		key: "callCustomEvent",
		value: function callCustomEvent(target, ev) {
			var event = new Event(ev);
			target = typeof target === 'string' ? document.getElementById(target) : target;
			target.dispatchEvent(event);
		}
	}, {
		key: "setRussianTranslation",
		value: function setRussianTranslation(nodelist) {
			if (this.lang === 'ru') {
				nodelist = document.querySelectorAll(nodelist);
				[].concat(_toConsumableArray(nodelist)).forEach(function (el, i) {
					el.innerHTML = JSON.parse(el.dataset.lang).ru;
				});
			}
		}
	}, {
		key: "toggleSpinner",
		value: function toggleSpinner(spinner, toggle) {
			document.getElementById(spinner).parentNode.classList[toggle ? 'remove' : 'add']('is-hidden');
		}
	}, {
		key: "buildFunding",
		value: function buildFunding(src) {
			var _this3 = this;

			var iframe_parent = document.getElementById('iframe_place');

			if (!this.iframe) {

				var iframe = document.createElement('iframe');
				iframe.src = "https://funding.webmoney.ru/widgets/horizontal/" + src;
				iframe.id = 'iframe';
				iframe.width = 468;
				iframe.height = 200;
				iframe.scrolling = 'no';
				iframe.style.border = 0;

				iframe_parent.appendChild(iframe);

				iframe.onload = function () {
					_this3.toggleSpinner('spinner');
					_this3.iframe = true;
				};
			}
		}
	}, {
		key: "setCurrency",
		value: function setCurrency(code) {
			var select = document.getElementById('select_currency');
			var indx = [].concat(_toConsumableArray(select.options)).map(function (v) {
				return v.value;
			}).indexOf(code);
			select.selectedIndex = indx;
			this.callCustomEvent(select, 'change');
		}
	}, {
		key: "showFunding",
		value: function showFunding() {
			if (this.lang === 'ru') {
				document.getElementById('funding').classList.remove('is-hidden');
			}
		}
	}, {
		key: "changeFundingAmount",
		value: function changeFundingAmount(n) {
			var iframe = document.getElementById('iframe');

			if (iframe) {
				iframe.src = iframe.src.replace(/sum=\d+/, 'sum=' + n);
			}
		}
	}, {
		key: "events",
		value: function events() {
			var _this4 = this;

			document.addEventListener('click', function (e) {
				var target = e.target;
				while (!target.id) {
					if (target.tagName === 'HTML') return;
					target = target.parentNode;
				}

				switch (target.id) {
					case 'paypal':
						_this4.toggleSpinner('spinner', true);
						break;
					case 'funding':
						if (!_this4.iframe) {
							_this4.toggleSpinner('spinner', true);
							_this4.setCurrency('RUB');
							_this4.buildFunding('aab58ddd-d6d5-4dad-940f-16eb3422ada9?hs=1&bt=0&sum=100');
						}
						break;
					default:
				}
			});
		}
	}]);

	return Donate;
}();

var donate = new Donate();
setTimeout(function () {
	donate.events();
	donate.setRussianTranslation('*[data-lang]');
	donate.showFunding();
	donate.buildCurrency('select_currency');
	donate.changeRange('range');
	donate.changeCurrency('select_currency');
	donate.callCustomEvent('range', 'change');
}, 10);