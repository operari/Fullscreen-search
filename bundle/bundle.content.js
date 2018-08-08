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
   * Class constructor for Textfield MDL component.
   * Implements MDL component design pattern defined at:
   * https://github.com/jasonmayes/mdl-component-design-pattern
   *
   * @constructor
   * @param {HTMLElement} element The element that will be upgraded.
   */

  var MaterialTextfield = function MaterialTextfield(element) {
    this.element_ = element;
    this.maxRows = this.Constant_.NO_MAX_ROWS;
    // Initialize instance.
    this.init();
  };
  window['MaterialTextfield'] = MaterialTextfield;

  /**
   * Store constants in one place so they can be updated easily.
   *
   * @enum {string | number}
   * @private
   */
  MaterialTextfield.prototype.Constant_ = {
    NO_MAX_ROWS: -1,
    MAX_ROWS_ATTRIBUTE: 'maxrows'
  };

  /**
   * Store strings for class names defined by this component that are used in
   * JavaScript. This allows us to simply change it in one place should we
   * decide to modify at a later date.
   *
   * @enum {string}
   * @private
   */
  MaterialTextfield.prototype.CssClasses_ = {
    LABEL: 'mdl-textfield__label',
    INPUT: 'mdl-textfield__input',
    IS_DIRTY: 'is-dirty',
    IS_FOCUSED: 'is-focused',
    IS_DISABLED: 'is-disabled',
    IS_INVALID: 'is-invalid',
    IS_UPGRADED: 'is-upgraded',
    HAS_PLACEHOLDER: 'has-placeholder'
  };

  /**
   * Handle input being entered.
   *
   * @param {Event} event The event that fired.
   * @private
   */
  MaterialTextfield.prototype.onKeyDown_ = function (event) {
    var currentRowCount = event.target.value.split('\n').length;
    if (event.keyCode === 13) {
      if (currentRowCount >= this.maxRows) {
        event.preventDefault();
      }
    }
  };

  /**
   * Handle focus.
   *
   * @param {Event} event The event that fired.
   * @private
   */
  MaterialTextfield.prototype.onFocus_ = function (event) {
    this.element_.classList.add(this.CssClasses_.IS_FOCUSED);
  };

  /**
   * Handle lost focus.
   *
   * @param {Event} event The event that fired.
   * @private
   */
  MaterialTextfield.prototype.onBlur_ = function (event) {
    this.element_.classList.remove(this.CssClasses_.IS_FOCUSED);
  };

  /**
   * Handle reset event from out side.
   *
   * @param {Event} event The event that fired.
   * @private
   */
  MaterialTextfield.prototype.onReset_ = function (event) {
    this.updateClasses_();
  };

  /**
   * Handle class updates.
   *
   * @private
   */
  MaterialTextfield.prototype.updateClasses_ = function () {
    this.checkDisabled();
    this.checkValidity();
    this.checkDirty();
    this.checkFocus();
  };

  // Public methods.

  /**
   * Check the disabled state and update field accordingly.
   *
   * @public
   */
  MaterialTextfield.prototype.checkDisabled = function () {
    if (this.input_.disabled) {
      this.element_.classList.add(this.CssClasses_.IS_DISABLED);
    } else {
      this.element_.classList.remove(this.CssClasses_.IS_DISABLED);
    }
  };
  MaterialTextfield.prototype['checkDisabled'] = MaterialTextfield.prototype.checkDisabled;

  /**
  * Check the focus state and update field accordingly.
  *
  * @public
  */
  MaterialTextfield.prototype.checkFocus = function () {
    if (Boolean(this.element_.querySelector(':focus'))) {
      this.element_.classList.add(this.CssClasses_.IS_FOCUSED);
    } else {
      this.element_.classList.remove(this.CssClasses_.IS_FOCUSED);
    }
  };
  MaterialTextfield.prototype['checkFocus'] = MaterialTextfield.prototype.checkFocus;

  /**
   * Check the validity state and update field accordingly.
   *
   * @public
   */
  MaterialTextfield.prototype.checkValidity = function () {
    if (this.input_.validity) {
      if (this.input_.validity.valid) {
        this.element_.classList.remove(this.CssClasses_.IS_INVALID);
      } else {
        this.element_.classList.add(this.CssClasses_.IS_INVALID);
      }
    }
  };
  MaterialTextfield.prototype['checkValidity'] = MaterialTextfield.prototype.checkValidity;

  /**
   * Check the dirty state and update field accordingly.
   *
   * @public
   */
  MaterialTextfield.prototype.checkDirty = function () {
    if (this.input_.value && this.input_.value.length > 0) {
      this.element_.classList.add(this.CssClasses_.IS_DIRTY);
    } else {
      this.element_.classList.remove(this.CssClasses_.IS_DIRTY);
    }
  };
  MaterialTextfield.prototype['checkDirty'] = MaterialTextfield.prototype.checkDirty;

  /**
   * Disable text field.
   *
   * @public
   */
  MaterialTextfield.prototype.disable = function () {
    this.input_.disabled = true;
    this.updateClasses_();
  };
  MaterialTextfield.prototype['disable'] = MaterialTextfield.prototype.disable;

  /**
   * Enable text field.
   *
   * @public
   */
  MaterialTextfield.prototype.enable = function () {
    this.input_.disabled = false;
    this.updateClasses_();
  };
  MaterialTextfield.prototype['enable'] = MaterialTextfield.prototype.enable;

  /**
   * Update text field value.
   *
   * @param {string} value The value to which to set the control (optional).
   * @public
   */
  MaterialTextfield.prototype.change = function (value) {

    this.input_.value = value || '';
    this.updateClasses_();
  };
  MaterialTextfield.prototype['change'] = MaterialTextfield.prototype.change;

  /**
   * Initialize element.
   */
  MaterialTextfield.prototype.init = function () {

    if (this.element_) {
      this.label_ = this.element_.querySelector('.' + this.CssClasses_.LABEL);
      this.input_ = this.element_.querySelector('.' + this.CssClasses_.INPUT);

      if (this.input_) {
        if (this.input_.hasAttribute(
        /** @type {string} */this.Constant_.MAX_ROWS_ATTRIBUTE)) {
          this.maxRows = parseInt(this.input_.getAttribute(
          /** @type {string} */this.Constant_.MAX_ROWS_ATTRIBUTE), 10);
          if (isNaN(this.maxRows)) {
            this.maxRows = this.Constant_.NO_MAX_ROWS;
          }
        }

        if (this.input_.hasAttribute('placeholder')) {
          this.element_.classList.add(this.CssClasses_.HAS_PLACEHOLDER);
        }

        this.boundUpdateClassesHandler = this.updateClasses_.bind(this);
        this.boundFocusHandler = this.onFocus_.bind(this);
        this.boundBlurHandler = this.onBlur_.bind(this);
        this.boundResetHandler = this.onReset_.bind(this);
        this.input_.addEventListener('input', this.boundUpdateClassesHandler);
        this.input_.addEventListener('focus', this.boundFocusHandler);
        this.input_.addEventListener('blur', this.boundBlurHandler);
        this.input_.addEventListener('reset', this.boundResetHandler);

        if (this.maxRows !== this.Constant_.NO_MAX_ROWS) {
          // TODO: This should handle pasting multi line text.
          // Currently doesn't.
          this.boundKeyDownHandler = this.onKeyDown_.bind(this);
          this.input_.addEventListener('keydown', this.boundKeyDownHandler);
        }
        var invalid = this.element_.classList.contains(this.CssClasses_.IS_INVALID);
        this.updateClasses_();
        this.element_.classList.add(this.CssClasses_.IS_UPGRADED);
        if (invalid) {
          this.element_.classList.add(this.CssClasses_.IS_INVALID);
        }
        if (this.input_.hasAttribute('autofocus')) {
          this.element_.focus();
          this.checkFocus();
        }
      }
    }
  };

  // The component registers itself. It can assume componentHandler is available
  // in the global scope.
  componentHandler.register({
    constructor: MaterialTextfield,
    classAsString: 'MaterialTextfield',
    cssClass: 'mdl-js-textfield',
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
   * Class constructor for Tooltip MDL component.
   * Implements MDL component design pattern defined at:
   * https://github.com/jasonmayes/mdl-component-design-pattern
   *
   * @constructor
   * @param {HTMLElement} element The element that will be upgraded.
   */

  var MaterialTooltip = function MaterialTooltip(element) {
    this.element_ = element;

    // Initialize instance.
    this.init();
  };
  window['MaterialTooltip'] = MaterialTooltip;

  /**
   * Store constants in one place so they can be updated easily.
   *
   * @enum {string | number}
   * @private
   */
  MaterialTooltip.prototype.Constant_ = {
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
  MaterialTooltip.prototype.CssClasses_ = {
    IS_ACTIVE: 'is-active',
    BOTTOM: 'mdl-tooltip--bottom',
    LEFT: 'mdl-tooltip--left',
    RIGHT: 'mdl-tooltip--right',
    TOP: 'mdl-tooltip--top'
  };

  /**
   * Handle mouseenter for tooltip.
   *
   * @param {Event} event The event that fired.
   * @private
   */
  MaterialTooltip.prototype.handleMouseEnter_ = function (event) {
    var props = event.target.getBoundingClientRect();
    var left = props.left + props.width / 2;
    var top = props.top + props.height / 2;
    var marginLeft = -1 * (this.element_.offsetWidth / 2);
    var marginTop = -1 * (this.element_.offsetHeight / 2);

    if (this.element_.classList.contains(this.CssClasses_.LEFT) || this.element_.classList.contains(this.CssClasses_.RIGHT)) {
      left = props.width / 2;
      if (top + marginTop < 0) {
        this.element_.style.top = '0';
        this.element_.style.marginTop = '0';
      } else {
        this.element_.style.top = top + 'px';
        this.element_.style.marginTop = marginTop + 'px';
      }
    } else {
      if (left + marginLeft < 0) {
        this.element_.style.left = '0';
        this.element_.style.marginLeft = '0';
      } else {
        this.element_.style.left = left + 'px';
        this.element_.style.marginLeft = marginLeft + 'px';
      }
    }

    if (this.element_.classList.contains(this.CssClasses_.TOP)) {
      this.element_.style.top = props.top - this.element_.offsetHeight - 10 + 'px';
    } else if (this.element_.classList.contains(this.CssClasses_.RIGHT)) {
      this.element_.style.left = props.left + props.width + 10 + 'px';
    } else if (this.element_.classList.contains(this.CssClasses_.LEFT)) {
      this.element_.style.left = props.left - this.element_.offsetWidth - 10 + 'px';
    } else {
      this.element_.style.top = props.top + props.height + 10 + 'px';
    }

    this.element_.classList.add(this.CssClasses_.IS_ACTIVE);
  };

  /**
   * Hide tooltip on mouseleave or scroll
   *
   * @private
   */
  MaterialTooltip.prototype.hideTooltip_ = function () {
    this.element_.classList.remove(this.CssClasses_.IS_ACTIVE);
  };

  /**
   * Initialize element.
   */
  MaterialTooltip.prototype.init = function () {

    if (this.element_) {
      var forElId = this.element_.getAttribute('for') || this.element_.getAttribute('data-mdl-for');

      if (forElId) {
        this.forElement_ = document.getElementById(forElId);
      }

      if (this.forElement_) {
        // It's left here because it prevents accidental text selection on Android
        if (!this.forElement_.hasAttribute('tabindex')) {
          this.forElement_.setAttribute('tabindex', '0');
        }

        this.boundMouseEnterHandler = this.handleMouseEnter_.bind(this);
        this.boundMouseLeaveAndScrollHandler = this.hideTooltip_.bind(this);
        this.forElement_.addEventListener('mouseenter', this.boundMouseEnterHandler, false);
        this.forElement_.addEventListener('touchend', this.boundMouseEnterHandler, false);
        this.forElement_.addEventListener('mouseleave', this.boundMouseLeaveAndScrollHandler, false);
        window.addEventListener('scroll', this.boundMouseLeaveAndScrollHandler, true);
        window.addEventListener('touchstart', this.boundMouseLeaveAndScrollHandler);
      }
    }
  };

  // The component registers itself. It can assume componentHandler is available
  // in the global scope.
  componentHandler.register({
    constructor: MaterialTooltip,
    classAsString: 'MaterialTooltip',
    cssClass: 'mdl-tooltip'
  });
})();
'use strict';

var utils = function () {

  return {

    parseSvg: function parseSvg(svg) {
      var sMyString = svg;
      var oParser = new DOMParser();
      var oDOM = oParser.parseFromString(sMyString, "text/xml");

      return oDOM.documentElement;
    },
    addElement: function addElement(tag, cls, id, text, val, attr) {
      var el = document.createElement(tag);

      if (cls) el.className = cls;
      if (id) el.id = id;
      if (val || typeof val == 'number') el.value = val;
      if (text || typeof val == 'number') el.textContent = text;
      if (attr) {
        for (var prop in attr) {
          el.setAttribute(prop, attr[prop]);
        }
      }

      return el;
    },
    buildCustomDom: function buildCustomDom(html) {
      var doc = document.implementation.createHTMLDocument();
      doc.documentElement.innerHTML = html;

      return doc;
    },
    extend: function extend(f, o, p) {

      var o1 = {};
      var prop;

      if (f) {
        for (prop in o) {
          o1[prop] = o[prop];
        }
      }

      for (prop in p) {
        f ? o1[prop] = p[prop] : o[prop] = p[prop];
      }

      return f ? o1 : o;
    }
  };
}();
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Search = function () {
	function Search() {
		_classCallCheck(this, Search);

		this.search = false; // поиск отображен
		this.tabs = false; // табы отображены
		this.search_id = 'f_search';
		this.element = null;
		this.open = '_blank';
		this.pressed = []; // контенйнер для нажатой клавишы
		this.my_latest_tap = 0;
		this.taps = 0;
		this.lang = 'en';
		this.self = false; // открыть на странице; копируется из настроек popup.js
		this.background = true; // копируется из настроек popup.js
		this.bg_animation = true; // копируется из настроек popup.js
		this.touch = true; // копируется из настроек popup.js
		this.search_engine = 'google'; // копируется из настроек popup.js
		this.keys = ['Control', 'Enter']; // копируется из настроек popup.js
		this.keys_tabs = ['ArrowDown', 'ArrowUp'];
		this.shortcuts = ['f:facebook.com']; // кастомные сокращения
		this.exclude_urls = ['linkedin.com'];
		this.tabs_collection = null; // коллекция табов при открытии окна с табами
		this.suggests_collection = null; // коллекция подсказок
		this.suggests = [];
		this.suggest = { "id": 0, "request": "", "typeCount": 0 };
		this.matches_request = [];
		this.suggests_limit = 10;
		this.suggests_show = false; // подсказки отображены
		this.search_engine_data = {
			'google': {
				'origin': 'https://google.by/',
				'search': 'search?q=',
				'shortcut': 'g',
				'favicon': 'img/google.png'
			},
			'bing': {
				'origin': 'https://bing.com/',
				'search': 'search?q=',
				'shortcut': 'b',
				'favicon': 'img/bing.png'
			},
			'yandex': {
				'origin': 'https://yandex.by/',
				'search': 'search/?text=',
				'shortcut': 'y',
				'favicon': 'img/yandex.png'
			},
			'duckduck': {
				'origin': 'https://duckduckgo.com/',
				'search': '?q=',
				'shortcut': 'd',
				'favicon': 'img/duckduck.png'
			},
			'baidu': {
				'origin': 'http://baidu.com/',
				'search': 's?wd=',
				'shortcut': 'du',
				'favicon': 'img/baidu.png'
			},
			'youtube': {
				'origin': 'http://youtube.com/',
				'search': 'results?search_query=',
				'shortcut': 'yt',
				'favicon': 'img/youtube.png'
			},
			'wikipedia': {
				'origin': 'http://wikipedia.org/',
				'search': 'w/index.php?search=',
				'shortcut': 'w',
				'favicon': 'img/wikipedia.png'
			},
			'github': {
				'origin': 'http://github.com/',
				'search': 'search?utf8=✓&q=',
				'shortcut': 'gt',
				'favicon': 'img/github.png'
			}
		};
	}

	_createClass(Search, [{
		key: 'appendSearch',
		value: function appendSearch() {
			var _this = this;

			var w = utils.addElement('div', 'wrp-textfield fs-search is-hidden--fs-search mdl-shadow--4dp');
			var d = utils.addElement('div', 'mdl-textfield mdl-js-textfield mdl-textfield--floating-label');
			var inp = utils.addElement('input', 'mdl-textfield__input', this.search_id, false, false, { 'autocomplete': 'off' });
			var lbl = utils.addElement('label', 'mdl-textfield__label', false, this.lang === 'en' ? 'Search' : 'Введите запрос', false, { 'for': this.search_id });
			var cls_ico = utils.addElement('span', 'mdl-textfield__close svg-icon', 'f_close_btn');
			var s_ico = utils.addElement('span', 'mdl-textfield__search svg-icon', 'f_search_btn');
			var suggests = utils.addElement('div', 'mdl-textfield__suggests mdl-shadow--2d is-hidden--fs-search', 'suggests_search');
			var ul = utils.addElement('ul', 'mdl-textfield__suggests-ul');
			var shortcuts_list_img = utils.addElement('div', 'shortcuts-list-img');
			var ul1 = utils.addElement('ul', 'shortcuts-list-img__ul mdl-shadow--2dp is-hidden--fs-search');
			var sl_ico = utils.addElement('span', 'shortcuts-list-img__arrow svg-icon', 'f_arrow');
			Object.keys(this.search_engine_data).forEach(function (v, i) {
				var li = utils.addElement('li', 'shortcuts-list-img__li');
				var ico = utils.addElement('img', 'shortcuts-list-img__ico', 'search_icon_' + i, false, false, { 'src': chrome.extension.getURL(_this.search_engine_data[v].favicon), 'data-shortcut': _this.search_engine_data[v].shortcut });
				var tooltip = utils.addElement('div', 'mdl-tooltip mdl-tooltip--right', false, _this.search_engine_data[v].shortcut, false, { 'data-mdl-for': 'search_icon_' + i });
				li.appendChild(ico);
				li.appendChild(tooltip);
				ul1.appendChild(li);
				setTimeout(function () {
					componentHandler.upgradeElement(tooltip);
				}, 10);
			});
			shortcuts_list_img.appendChild(sl_ico);
			shortcuts_list_img.appendChild(ul1);
			suggests.appendChild(ul);
			d.appendChild(inp);
			d.appendChild(lbl);
			d.appendChild(s_ico);
			d.appendChild(cls_ico);
			d.appendChild(suggests);
			d.appendChild(shortcuts_list_img);
			w.appendChild(d);
			componentHandler.upgradeElement(d);
			document.documentElement.appendChild(w);
			this.element = document.getElementById(this.search_id);
		}
	}, {
		key: 'appendBackground',
		value: function appendBackground() {
			var d = utils.addElement('div', 'layout-bg--fs-search layout-bg--animation is-hidden--fs-search', 'f_bg');
			document.documentElement.appendChild(d);
		}
	}, {
		key: 'addPrefixLangSearchEngine',
		value: function addPrefixLangSearchEngine() {
			var url = this.search_engine_data.wikipedia.origin;
			this.search_engine_data.wikipedia.origin = url.replace(/^http:\/\//, 'http://' + this.lang + '.');
		}
	}, {
		key: 'docEvents',
		value: function docEvents() {
			var _this2 = this;

			for (var i = 0; i < this.search_engine_data.length; i++) {
				// console.log(this.search_engine_data[i]);
			}

			var error_keys = ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'];

			document.addEventListener('keyup', function (e) {
				var id = e.target.id;

				if (id && id === _this2.search_id) {
					if (error_keys.indexOf(e.key) === -1) {
						var m = _this2.saveMatchesRequest(_this2.element.value);
						if (m) {
							_this2.buildSuggests();
						} else {
							_this2.removeSuggests();
						}
					}
					_this2.appendSearchEngineFavicon(e);
				}
			});

			document.addEventListener('keydown', function (e) {
				var id = e.target.id;
				switch (id) {
					case _this2.search_id:
						_this2.checkKeys(e, true);
						break;
					default:
						var check = _this2.checkKeys(e);
						if (check) _this2.sendMessage({ "query": "update", "data": check });

				}
			});

			document.addEventListener('touchstart', function (e) {
				if (_this2.touch && e.target.tagName !== 'VIDEO') _this2.tap(e);
			});

			document.addEventListener('click', function (e) {
				var target = e.target.id ? e.target : e.target.parentNode;

				switch (target.id) {
					case 'f_search_btn':
						_this2.openRequest(_this2.element.value);
						break;
					case 'f_close_btn':
						_this2.search = false;
						_this2.toggleSearch();
						break;
					case 'f_arrow':
						_this2.toggleShortcutsListImg();
						break;
					default:
						target = e.target;

						if (target.classList.contains('shortcuts-list-img__ico')) {
							_this2.insertShortcutWithClick(target);
						}

						if (target.classList.contains('mdl-textfield__suggests-button')) {
							_this2.removeSuggest(target);
							break;
						}

						if (target.classList.contains('mdl-textfield__suggests-text')) {
							_this2.element.value += target.textContent;
							_this2.openRequest(_this2.element.value);
							break;
						}

						if (target.classList.contains('tab-nav__close')) {
							// console.log(target);
							_this2.sendMessage({ "query": "remove", "data": +target.parentNode.dataset.id });
						} else {
							while (!target.classList.contains('tab-nav__tab')) {
								if (target.tagName === 'HTML') return;
								target = target.parentNode;
							}
							_this2.sendMessage({ "query": "update", "data": +target.dataset.id });
						}

				}
			});
		}
	}, {
		key: 'tap',
		value: function tap(e) {
			var touch = e.type === 'touchstart' ? true : false;
			var now = new Date().getTime();
			var time_since = now - this.my_latest_tap;

			this.taps += 1;

			if (time_since < 190) {
				if (time_since > 50) {
					if (this.tabs) {
						this.removeLinksTab();
					} else {
						if (!this.tabs) {
							this.search = !this.search ? true : false;
							this.toggleSearch(touch);
						}
					}
					this.taps = 0;
				} else {
					if (this.taps === 3 && !this.tabs && !this.search) {
						this.sendMessage({ "query": "tabs" });
					}
				}
			}

			this.taps = !(this.taps % 3) ? 0 : this.taps;
			this.my_latest_tap = now;
		}
	}, {
		key: 'checkKeys',
		value: function checkKeys(e, input) {
			var _this3 = this;

			var k = e.key;

			if (k === 'Escape') {
				if (this.search) {
					this.search = false;
					setTimeout(function () {
						_this3.toggleSearch();
					}, 0);
				}
				if (this.tabs) {
					this.removeLinksTab();
				}
			}

			if (k === 'Delete' && this.tabs) {
				var tabs = document.querySelectorAll('.tab-nav__tab');
				var tab_active = [].concat(_toConsumableArray(tabs)).filter(function (v, i) {
					return v.classList.contains('is-active');
				})[0];
				if (tab_active) {
					tab_active.querySelector('.tab-nav__close').click();
				}
			}

			// if (k === 'Delete' && this.suggests_show) {
			// 	const active_suggest = [...this.suggests_collection].filter(v => v.classList.contains('is-active'))[0];
			// 	active_suggest.querySelector('button').click();
			// }

			if (input) {

				if (k === 'Enter') {
					this.updateSuggests(this.element.value);
					this.openRequest(this.element.value);
				}

				if (k === 'ArrowUp' || k === 'ArrowDown') {
					if (this.suggests_show) {
						this.selectList(Array.from(this.suggests_collection), k);
						this.removePlugSuggest();
					}
					this.setSelectSuggest();
					this.setSeletionRange(e.target);
				}

				return;
			}

			if (this.keys && k === this.keys[0]) {
				this.pressed[0] = k;
				setTimeout(function () {
					_this3.pressed = [];
				}, 500);
			}

			// toggle search
			if (k === this.keys[1] && this.pressed[0] && !this.tabs) {
				this.search = true;
				this.pressed = [];
				this.rewriteProps();

				setTimeout(function () {
					_this3.toggleSearch();
				}, 0);
			}

			// toggle tabs
			if (~this.keys_tabs.indexOf(k) && this.pressed[0] && !this.search) {
				if (!this.tabs) {
					setTimeout(function () {
						_this3.sendMessage({ "query": "tabs" });
					}, 0);
				} else {
					setTimeout(function () {
						_this3.removeLinksTab();
					}, 0);
				}
			}

			if ((k === 'ArrowUp' || k === 'ArrowDown') && this.tabs) {
				this.selectList(this.tabs_collection, k);
				this.scrollTabs(k);
			}

			if (k === 'f' && this.search) {
				this.element.focus();
				setTimeout(function () {
					if (_this3.element.value.length == 1) _this3.element.value = "";
				});
			}

			// go to tab
			if (k === 'Enter' && this.tabs) {
				var n = void 0;
				if (e.target.classList.contains('tab-nav__tab')) {
					n = e.target.dataset.id;
				} else {
					[].concat(_toConsumableArray(document.querySelectorAll('.tab-nav__tab'))).some(function (v, i) {
						if (v.classList.contains('is-active')) {
							n = v.dataset.id;
							return true;
						}
					});
				}
				return +n;
			}
		}
	}, {
		key: 'rewriteProps',
		value: function rewriteProps() {
			var _this4 = this;

			return new Promise(function (resolve, reject) {
				chrome.storage.local.get('search_props_', function (items) {
					_this4.sendMessage({ 'query': 'storage', 'key': 'search_props_' });
					if (Object.keys(items).length) {
						var storage_obj = JSON.parse(items.search_props_);

						for (var prop in storage_obj) {
							var val = storage_obj[prop];
							_this4[prop] = val;
						}
					}
					// console.log(this);
					resolve();
				});
			});
		}
	}, {
		key: 'toggleShortcutsListImg',
		value: function toggleShortcutsListImg() {
			document.querySelector('.shortcuts-list-img__ul').classList.toggle('is-hidden--fs-search');
			document.querySelector('.shortcuts-list-img__arrow').classList.toggle('shortcuts-list-img__arrow--rotate');
		}
	}, {
		key: 'insertShortcutWithClick',
		value: function insertShortcutWithClick(target) {
			var shortcut = target.dataset.shortcut;
			this.element.focus();
			this.element.value = shortcut + ':';
			this.callCustomEvent(this.element);
			this.toggleShortcutsListImg();
		}
	}, {
		key: 'callCustomEvent',
		value: function callCustomEvent(target) {
			var _this5 = this;

			var event = new Event('keyup');
			var handler = function handler(e) {
				_this5.appendSearchEngineFavicon(e);
			};
			target.addEventListener('keyup', handler, false);
			target.dispatchEvent(event);
			target.removeEventListener('keyup', handler, false);
		}
	}, {
		key: 'appendSearchEngineFavicon',
		value: function appendSearchEngineFavicon(e) {
			var key = e.key;
			var fav_class = 'mdl-textfield__favicon';

			var append_favicon = function append_favicon(favicon) {

				var fav = document.createElement('img');

				fav.onload = function () {
					e.target.parentNode.appendChild(this);
					e.target.classList.add('mdl-textfield__input--indent');
				};

				fav.className = fav_class;
				fav.src = chrome.extension.getURL(favicon);
			};

			var searches_data = this.search_engine_data;
			var re = /^([^:]+)(:)?(.*)?$/;
			var parse = re.exec(e.target.value);
			var shortcuts = [];
			var shortcuts_url = [];

			if (!shortcuts.length) {
				for (var prop in searches_data) {
					shortcuts.push(searches_data[prop].shortcut);
					shortcuts_url.push(searches_data[prop].favicon);
				}
			}

			var current_indx_match = shortcuts.indexOf(parse && parse[1]);

			if (~current_indx_match) {
				if (!document.querySelector('.' + fav_class)) {
					append_favicon(shortcuts_url[current_indx_match]);
					this.paste_indx_match = current_indx_match;
				} else {
					if (current_indx_match !== this.paste_indx_match) {
						this.removeSearchEngineFavicon(e.target);
						append_favicon(shortcuts_url[current_indx_match]);
					}
					this.paste_indx_match = current_indx_match;
				}
			} else {
				if (document.querySelector('.' + fav_class)) {
					this.removeSearchEngineFavicon(e.target);
				}
			}
		}
	}, {
		key: 'removeSearchEngineFavicon',
		value: function removeSearchEngineFavicon(input) {
			var fav = document.querySelector('.mdl-textfield__favicon');

			if (fav) {
				fav.remove();

				if (input) {
					input.classList.remove('mdl-textfield__input--indent');

					return true;
				}
			}

			return false;
		}
	}, {
		key: 'checkHostname',
		value: function checkHostname() {
			var hostname = window.location.hostname;
			return this.exclude_urls.some(function (v, idx) {
				return v === hostname.replace(/^www./, '');
			});
		}
	}, {
		key: 'handlerToggleScroll',
		value: function handlerToggleScroll() {
			window.scrollTo(0, scroll_pos);
		}
	}, {
		key: 'toggleScroll',
		value: function toggleScroll() {
			window.scroll_pos = document.documentElement.scrollTop;
			window[this.tabs ? "addEventListener" : "removeEventListener"]("scroll", this.handlerToggleScroll);
		}
	}, {
		key: 'toggleSearch',
		value: function toggleSearch(touch) {
			var _this6 = this;

			if (this.checkHostname()) return false;
			this.element.parentNode.parentNode.classList[this.search ? 'remove' : 'add']('is-hidden--fs-search');

			if (!this.search) {
				this.element.value = '';
				this.removeSearchEngineFavicon(this.element);
				this.removeSuggests();
			}

			if (!this.element.parentNode.parentNode.classList.contains('is-hidden--fs-search')) {
				var delay = touch ? 350 : 0;
				setTimeout(function () {
					_this6.element.focus();
				}, delay);
			}
			this.toggleBackground();
			return true;
		}
	}, {
		key: 'toggleBackground',
		value: function toggleBackground() {
			if (this.background) {
				var bg = document.getElementById('f_bg');
				bg.classList[this.search || this.tabs ? 'remove' : 'add']('is-hidden--fs-search');
				bg.classList[this.bg_animation ? 'add' : 'remove']('layout-bg--animation');
			}
		}
	}, {
		key: 'updateSuggests',
		value: function updateSuggests(request) {
			var re = /^(.+:)/;
			request = request.replace(re, '').toLowerCase();

			var find_suggest_indx = this.suggests.findIndex(function (o, i) {
				return request === o.request;
			});

			if (~find_suggest_indx) {
				this.suggests[find_suggest_indx].typeCount++;
			} else {
				var suggest_tmp = Object.assign({}, this.suggest);
				suggest_tmp.request = request;
				var n = this.suggests.push(suggest_tmp);
				this.suggests[--n].id = n;
			}

			this.saveSuggests();
			this.getSuggests();
		}
	}, {
		key: 'getSuggests',
		value: function getSuggests() {
			var _this7 = this;

			chrome.storage.local.get('suggests', function (items) {
				if (items.suggests && items.suggests.length) {
					_this7.suggests = items.suggests;
					// console.log(JSON.stringify(this.suggests, null, 3));
				}
			});
		}
	}, {
		key: 'saveSuggests',
		value: function saveSuggests() {
			chrome.storage.local.set({ 'suggests': this.suggests });
		}
	}, {
		key: 'setSelectSuggest',
		value: function setSelectSuggest() {
			var active = [].concat(_toConsumableArray(this.suggests_collection)).filter(function (v) {
				return v.classList.contains('is-active');
			})[0];
			var re = /^(.+:)?(.+)/;

			if (active) {
				var txt = active.firstElementChild.textContent;
				this.element.value = this.element.value.replace(re, '$1' + txt);
			}
		}
	}, {
		key: 'setSeletionRange',
		value: function setSeletionRange(input) {
			var n = input.value.length;
			setTimeout(function () {
				input.setSelectionRange(n, n);
			}, 0);
		}
	}, {
		key: 'reindexSuggests',
		value: function reindexSuggests() {
			var _this8 = this;

			if (!this.suggest_removed) return;
			this.suggests.forEach(function (v, i) {
				return _this8.suggests[i].id = i;
			});
			this.saveSuggests();
			this.suggest_removed = false;
		}
	}, {
		key: 'removeSuggest',
		value: function removeSuggest(target) {
			var id = target.parentNode.dataset.suggestId;
			var indx = this.suggests.findIndex(function (v) {
				return v.id === +id;
			});
			this.suggests.splice(indx, 1);

			var suggests = document.querySelectorAll('.mdl-textfield__suggests-suggest');
			var elem = [].concat(_toConsumableArray(suggests)).filter(function (v, i) {
				return v.dataset.suggestId && +v.dataset.suggestId === +id;
			})[0];

			if (elem) {
				elem.innerHTML = this.lang === 'ru' ? 'Подсказка удалена' : 'Suggest removed';
				elem.classList.add('is-remove');
			}

			this.suggest_removed = true;
		}
	}, {
		key: 'removeSuggests',
		value: function removeSuggests() {
			var suggests = document.getElementById('suggests_search');
			parent = suggests.firstElementChild;

			if (parent.childElementCount) {
				while (parent.firstElementChild) {
					parent.removeChild(parent.firstElementChild);
				}
				parent.parentNode.classList.add('is-hidden--fs-search');
			}

			this.suggests_collection = [];
			this.suggests_show = false;
			this.reindexSuggests();
		}
	}, {
		key: 'removePlugSuggest',
		value: function removePlugSuggest() {
			if (this.plug_suggest) {
				var suggests = document.getElementById('suggests_search');
				var ul = suggests.firstElementChild;
				ul.removeChild(ul.firstElementChild);
				this.suggests_collection = document.querySelectorAll('.mdl-textfield__suggests-suggest');
				this.plug_suggest = false;
			}
		}
	}, {
		key: 'addPlugSuggest',
		value: function addPlugSuggest(ul, n) {
			if (!n) {
				var plug_suggest = utils.addElement('li', 'mdl-textfield__suggests-suggest');
				ul.appendChild(plug_suggest);
				this.plug_suggest = true;
			}
		}
	}, {
		key: 'buildSuggests',
		value: function buildSuggests() {
			var _this9 = this;

			this.removeSuggests();
			this.reindexSuggests();

			var suggests = document.getElementById('suggests_search');

			if (!this.matches_request.length) return;

			this.matches_request.some(function (v, i) {

				if (i > 9) return true;

				_this9.addPlugSuggest(suggests.firstElementChild, i);

				var suggest = utils.addElement('li', 'mdl-textfield__suggests-suggest', false, false, false, { 'data-suggest-id': v.id });
				var span = utils.addElement('span', 'mdl-textfield__suggests-text', false, v.request);
				var button = utils.addElement('button', 'mdl-textfield__suggests-button', false, _this9.lang === 'ru' ? 'Удалить' : 'Remove', false);
				suggest.appendChild(span);
				suggest.appendChild(button);

				suggests.firstElementChild.appendChild(suggest);
			});

			this.suggests_collection = document.querySelectorAll('.mdl-textfield__suggests-suggest');

			if (!this.suggests_show) {
				suggests_search.classList.remove('is-hidden--fs-search');
				this.suggests_show = true;
			}
		}
	}, {
		key: 'saveMatchesRequest',
		value: function saveMatchesRequest(request, e) {
			var _this10 = this;

			var re = /^(.+:)/;
			request = request.replace(re, '').toLowerCase();

			if (!request) return false;

			var request_words = request.split(' ').filter(function (v) {
				return v;
			});

			this.matches_request = [];
			this.suggests.forEach(function (o, i) {
				var suggest = Object.assign({}, o);
				var suggest_words = suggest.request.split(' ').filter(function (v) {
					return v;
				});

				request_words.some(function (v, n) {
					var request_split_word = v;

					return suggest_words.some(function (v1, n1) {
						var suggest_split_word = v1;

						if (suggest_split_word.indexOf(request_split_word) === 0) {
							_this10.matches_request.push({ "id": suggest.id, "sort": suggest.typeCount, "request": suggest.request });
							return true;
						}

						return false;
					});
				});
			});

			this.matches_request.sort(function (a, b) {
				return b.sort - a.sort;
			});

			return true;
		}
	}, {
		key: 'openRequest',
		value: function openRequest(val) {
			var _this11 = this;

			var request = val;
			var open = this.self ? '_self' : this.open;

			var parseShortcutSearchEgine = function parseShortcutSearchEgine(request) {
				var o1 = _this11.search_engine_data;
				var re = /^(.+):(.+)/;
				var parse = re.exec(request);

				for (var o2 in o1) {
					var s = o1[o2].shortcut;

					if (request === s) return o1[o2];
					if (parse && parse[1] === s) {
						o1[o2].url = parse[2];
						o1[o2].key = o2;
						return o1[o2];
					}
				}

				return false;
			};

			var parseCustomShortCut = function parseCustomShortCut(request) {
				var re = /^(.+):([^/]+)(.*)?/;
				var req = re.exec(request);

				var shortcut = _this11.shortcuts.filter(function (v, idx) {
					return re.exec(v)[1] === (req ? req[1] : request);
				})[0];

				return shortcut && !req ? re.exec(shortcut)[2] : shortcut && req ? re.exec(shortcut)[2] + re.exec(shortcut)[3] + req[2] : false;
			};

			var parseDomain = function parseDomain(request) {
				var zone = /\.[a-zA-Z]+$/g;
				var url = /(?:http[s]?:\/\/)?(.+)/i;

				return zone.test(request) ? url.exec(request)[1] : false;
			};

			var _parseShortcutSearchE = parseShortcutSearchEgine(request),
			    origin = _parseShortcutSearchE.origin,
			    search = _parseShortcutSearchE.search,
			    favicon = _parseShortcutSearchE.favicon,
			    url = _parseShortcutSearchE.url,
			    key = _parseShortcutSearchE.key;

			var parse_engine = origin;
			var parse_custom = parseCustomShortCut(request);
			var parse_domain = parseDomain(request);

			if (parse_engine) {
				window.open(url ? origin + search + url : origin, open);
				if (key) {
					delete this.search_engine_data[key].url;
					delete this.search_engine_data[key].key;
				}
			} else if (parse_custom) {
				window.open('http://' + parse_custom, open);
			} else if (parse_domain) {
				window.open('http://' + parse_domain, open);
			} else {
				if (!request) return;
				// open url
				var _search_engine_data$s = this.search_engine_data[this.search_engine],
				    _origin = _search_engine_data$s.origin,
				    _search = _search_engine_data$s.search;

				window.open(_origin + _search + request, open);
			}

			this.search = false;
			this.toggleSearch();
		}
	}, {
		key: 'removeLinksTab',
		value: function removeLinksTab() {
			var card = document.querySelector('.tab-nav');
			card.remove();
			this.tabs = false;
			this.tabs_collection = null;
			this.toggleScroll();
			this.toggleBackground();
		}
	}, {
		key: 'buildLinksTab',
		value: function buildLinksTab(arr) {
			var card = utils.addElement('div', 'mdl-card fs-search tab-nav mdl-shadow--2dp is-hidden--fs-search');

			var appendData = function appendData(tab) {
				for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
					args[_key - 1] = arguments[_key];
				}

				args.forEach(function (v, n) {
					tab.appendChild(v);
				});
			};

			arr.forEach(function (v, n) {
				var favicon = utils.addElement('img', 'tab-nav__favicon');

				favicon.src = v.favIconUrl;

				var j = n += 1;
				var tab = utils.addElement('div', v.active ? 'tab-nav__tab tab-nav__tab--load is-active' : 'tab-nav__tab tab-nav__tab--load', false, false, false, {
					'tabIndex': j,
					'data-id': v.id
				});
				var number = utils.addElement('span', 'tab-nav__number', false, j + '.');
				var title = utils.addElement('span', 'tab-nav__title', false, v.title);
				var close = utils.addElement('span', 'tab-nav__close svg-icon', false);

				favicon.addEventListener('load', function (e) {
					appendData(tab, this, number, title, close);
					this.parentNode.classList.remove('tab-nav__tab--load');
				});

				favicon.addEventListener('error', function (e) {
					this.src = chrome.extension.getURL("img/no_favicon.png");
					appendData(tab, this, number, title, close);
					this.parentNode.classList.remove('tab-nav__tab--load');
				});

				card.appendChild(tab);
			});

			this.tabs = true;
			this.toggleScroll();
			this.toggleBackground();
			setTimeout(function () {
				card.classList.remove('is-hidden--fs-search');
			}, 10);

			document.documentElement.appendChild(card);
			this.tabs_collection = Array.from(document.querySelectorAll('.tab-nav__tab'));
			this.checkTabOutView();
		}
	}, {
		key: 'scrollTabs',
		value: function scrollTabs(key) {
			var tab_window = document.querySelector('.tab-nav');
			var tab_active = this.tabs_collection.filter(function (v) {
				return v.classList.contains('is-active');
			})[0];
			var tab_offset_top = tab_active.offsetTop;
			var tab_height = tab_active.offsetHeight;

			var scroller = function scroller(tab_pos, up) {

				if (tab_pos > tab_window.clientHeight) {
					var tab_offset = tab_pos - tab_window.clientHeight;
					var must_scroll = !up ? tab_window.scrollTop + tab_offset : tab_window.scrollTop - tab_offset;
					tab_window.scrollTo(0, must_scroll);
				}
			};

			var scrollToEdge = function scrollToEdge(x, y) {
				tab_window.scrollTo(x, y);
			};

			if (key === 'ArrowDown') {
				if (!tab_offset_top && tab_window.scrollHeight - tab_window.clientHeight === tab_window.scrollTop) {
					scrollToEdge(0, 0);
				} else {
					scroller(tab_offset_top + tab_height);
				}
			} else {
				var tab_offset_bot = tab_window.scrollHeight - (tab_offset_top + tab_height);
				if (!tab_offset_bot && !tab_window.scrollTop) {
					scrollToEdge(0, tab_window.scrollHeight - tab_window.clientHeight);
				} else {
					scroller(tab_offset_bot + tab_height, true);
				}
			}
		}
	}, {
		key: 'checkTabOutView',
		value: function checkTabOutView() {
			var tab_window = document.querySelector('.tab-nav');
			var tab_active = this.tabs_collection.filter(function (v) {
				return v.classList.contains('is-active');
			})[0];

			var must_scroll = tab_active.offsetTop + tab_active.offsetHeight - tab_window.clientHeight;

			if (must_scroll) {
				tab_window.scrollTo(0, must_scroll);
			}
		}
	}, {
		key: 'selectList',
		value: function selectList(elements, key) {
			if (!elements || !elements.length) return false;
			var index_actived = 0;
			var arr_assoc = new Array(elements.length);

			elements.forEach(function (v, i) {
				if (v.classList.contains('is-active')) {
					index_actived = i;
					arr_assoc[i] = 1;
				} else {
					arr_assoc[i] = 0;
				}
			});

			var n = index_actived;
			arr_assoc[n] = 0;

			if (key === 'ArrowDown') {
				arr_assoc[++n <= elements.length - 1 ? n : 0] = 1;
			} else {
				arr_assoc[--n === -1 ? elements.length - 1 : n] = 1;
			}

			var index_will_active = arr_assoc.indexOf(1);

			elements[index_actived].classList.remove('is-active');
			elements[index_will_active].classList.add('is-active');
		}
	}, {
		key: 'removeLinkTab',
		value: function removeLinkTab(id) {
			var point = this.tabs_collection.findIndex(function (elem) {
				return elem.dataset.id == id;
			});
			this.selectList(this.tabs_collection, 'ArrowDown');

			document.querySelector('div[data-id="' + id + '"]').remove();

			this.tabs_collection.splice(point, 1);
		}
	}, {
		key: 'sendMessage',
		value: function sendMessage() {
			var _this12 = this;

			var msg = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

			chrome.runtime.sendMessage(msg, function (response) {
				if (msg.query === "tabs") _this12.buildLinksTab(response);
				if (response.action === "tab_removed") _this12.removeLinkTab(response.data);
				if (response.action === "update") _this12.removeLinksTab();
			});
		}
	}, {
		key: 'getMessage',
		value: function getMessage() {
			var _this13 = this;

			chrome.runtime.onMessage.addListener(function (request) {
				if (request && request.action === "change_tab" && _this13.tabs) {
					_this13.removeLinksTab();
				}
			});
		}
	}, {
		key: 'storageClear',
		value: function storageClear() {
			chrome.storage.local.clear();
		}
	}, {
		key: 'onbeforeunload',
		value: function onbeforeunload() {
			var _this14 = this;

			window.onbeforeunload = function () {
				_this14.reindexSuggests();
			};
		}
	}]);

	return Search;
}();

var srch = new Search();
// srch.storageClear();
srch.rewriteProps().then(function (result) {
	srch.addPrefixLangSearchEngine();
	srch.appendBackground();
	srch.appendSearch();
	srch.getMessage();
	srch.docEvents();
	srch.getSuggests();
	srch.onbeforeunload();
}, function (error) {
	return console.log(error.message);
});
// console.log(chrome.tabs);