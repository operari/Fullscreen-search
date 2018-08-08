var utils = (function() {

  return {

    parseSvg: function(svg) {
      var sMyString = svg;
      var oParser = new DOMParser();
      var oDOM = oParser.parseFromString(sMyString, "text/xml");

      return oDOM.documentElement;
    },
    addElement: function(tag, cls, id, text, val, attr) {
      var el = document.createElement(tag);

      if (cls)
        el.className = cls;
      if (id)
        el.id = id;
      if (val || typeof(val) == 'number')
        el.value = val;
      if (text || typeof(val) == 'number')
        el.textContent = text;
      if (attr) {
        for (var prop in attr) {
          el.setAttribute(prop, attr[prop]);
        }
      }

      return el;
    },
    buildCustomDom: function(html) {
      var doc = document.implementation.createHTMLDocument();
      doc.documentElement.innerHTML = html;

      return doc;
    },
    extend: function(f, o, p) {

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

})();

