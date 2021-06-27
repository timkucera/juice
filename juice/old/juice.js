(function(juice, undefined) {

    _ = {
        isFunction: (x)=> Object.prototype.toString.call(x) === '[object Function]',
        isObject: (x)=> Object.prototype.toString.call(x) === '[object Object]',
        isString: (x)=> typeof x === 'string',
        isArray: (x)=> Array.isArray(x),
        slice: (obj,i)=> Object.fromEntries(Object.entries(obj).map(([k,v]) => {
            if (_.isArray(v)) return [k,v[i]];
            else return [k,v];
        })),
    }

    COLORS = {
        dull: {
            red: '#f44336', pink: '#e91e63', purple: '#9c27b0', violet: '#673ab7', indigo: '#3f51b5', blue: '#2196f3', sky: '#03a9f4', cyan: '#00bcd4', teal: '#009688', green: '#4caf50', apple: '#8bc34a', lime: '#cddc39', yellow: '#ffeb3b', amber: '#ffc107', orange: '#ff9800', fire: '#ff5722', brown: '#795548', asphalt: '#34495e', steel: '#607D8B', black: '#333333', grey: '#9e9e9e', white: '#eeeeee'
        },
        vibrant: {
            red: '#ff1744', pink: '#f50057', purple: '#d500f9', violet: '#651fff', indigo: '#3d5afe', blue: '#2979ff', sky: '#00b0ff', cyan: '#00e5ff', teal: '#1de9b6', green: '#00e676', apple: '#76ff03', lime: '#c6ff00', yellow: '#ffea00', amber: '#ffc400', orange: '#ff9100', fire: '#ff3d00', brown: '#795548', asphalt: '#34495e', steel: '#607D8B', black: '#333333', grey: '#9e9e9e', white: '#eeeeee'
        },
        pastel: {
            red: '#ff1744', pink: '#f50057', purple: '#d500f9', violet: '#651fff', indigo: '#3d5afe', blue: '#2979ff', sky: '#00b0ff', cyan: '#00e5ff', teal: '#1de9b6', green: '#00e676', apple: '#76ff03', lime: '#c6ff00', yellow: '#ffea00', amber: '#ffc400', orange: '#ff9100', fire: '#ff3d00', brown: '#795548', asphalt: '#34495e', steel: '#607D8B', black: '#333333', grey: '#9e9e9e', white: '#eeeeee'
        },
    }

    THEMES = {
        apple: {
            style: 'rounded',
            palette: COLORS.dull,
            color: {primary:'black'},
            font: {
                family: 'Verdana',
                size: 12,
                light: '#ffffff',
                dark: '#333333',
            },
            size: {
                border: 2,
                radius: 2,
                unit: 30,
            },
        }
    }

    function makeColor(base) {
        var h_rot = 1;
        var c_rot = 0.1;
        var l_rot = 10;

        function hex2rgb(hex) {
            var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
        }

        function rgb2hex(rgb) {
            var [r, g, b] = rgb;
            function componentToHex(c) {
                var hex = c.toString(16);
                return hex.length == 1 ? "0" + hex : hex;
            }
            return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
        }

        function lab2rgb(lab){
          var y = (lab[0] + 16) / 116,
              x = lab[1] / 500 + y,
              z = y - lab[2] / 200,
              r, g, b;

          x = 0.95047 * ((x * x * x > 0.008856) ? x * x * x : (x - 16/116) / 7.787);
          y = 1.00000 * ((y * y * y > 0.008856) ? y * y * y : (y - 16/116) / 7.787);
          z = 1.08883 * ((z * z * z > 0.008856) ? z * z * z : (z - 16/116) / 7.787);

          r = x *  3.2406 + y * -1.5372 + z * -0.4986;
          g = x * -0.9689 + y *  1.8758 + z *  0.0415;
          b = x *  0.0557 + y * -0.2040 + z *  1.0570;

          r = (r > 0.0031308) ? (1.055 * Math.pow(r, 1/2.4) - 0.055) : 12.92 * r;
          g = (g > 0.0031308) ? (1.055 * Math.pow(g, 1/2.4) - 0.055) : 12.92 * g;
          b = (b > 0.0031308) ? (1.055 * Math.pow(b, 1/2.4) - 0.055) : 12.92 * b;

          return [Math.round(Math.max(0, Math.min(1, r)) * 255),
                  Math.round(Math.max(0, Math.min(1, g)) * 255),
                  Math.round(Math.max(0, Math.min(1, b)) * 255)]
        }


        function rgb2lab(rgb){
          var r = rgb[0] / 255, g = rgb[1] / 255, b = rgb[2] / 255, x, y, z;

          r = (r > 0.04045) ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
          g = (g > 0.04045) ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
          b = (b > 0.04045) ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

          x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
          y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000;
          z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;

          x = (x > 0.008856) ? Math.pow(x, 1/3) : (7.787 * x) + 16/116;
          y = (y > 0.008856) ? Math.pow(y, 1/3) : (7.787 * y) + 16/116;
          z = (z > 0.008856) ? Math.pow(z, 1/3) : (7.787 * z) + 16/116;

          return [(116 * y) - 16, 500 * (x - y), 200 * (y - z)]
        }

        function lab2hcl(lab) {
            var [l,a,b] = lab;
            var c = Math.hypot(a,b);
            var h = Math.atan2(b,a)*180/Math.PI;
            h = h < 0 ? h + 360 : h;
            return [h,c,l];
        }

        function hcl2lab(hcl) {
            var [h,c,l] = hcl;
            var a = c*Math.cos(h*Math.PI/180);
            var b = c*Math.sin(h*Math.PI/180);
            return [l,a,b];
        }

        function tint(hcl,dir) {
            var [h,c,l] = hcl;
            h -= h_rot*dir
            c -= c*c_rot;
            l += l_rot;
            h = h<0 ? h+360 : h;
            h = h>360 ? 360-h : h;
            l = l<0 ? 0 : l;
            l = l>100 ? 100 : l;
            return [h,c,l];
        }

        function shade(hcl,dir) {
            var [h,c,l] = hcl;
            h += h_rot*dir;
            c -= c*c_rot;
            l -= l_rot;
            h = h<0 ? h+360 : h;
            h = h>360 ? 360-h : h;
            l = l<0 ? 0 : l;
            l = l>100 ? 100 : l;
            return [h,c,l];
        }

        function textcolor(hcl) {
            const [h,c,l] = hcl;
            if (l>65) return'#333333';
            else return '#ffffff';
        }

        function sigmoid(t) {
            return (1/(1+Math.pow(Math.E, -t/100))-0.5)*2;
        }

        var color = Object(base)
        var hcl = lab2hcl(rgb2lab(hex2rgb(base)));
        var t = hcl;
        var s = hcl;
        var dir = hcl[0] >= 45 && hcl[0] <= 45+180 ? 1 : -1;
        var amp = Math.abs(hcl[0]-225)/225;
        var r = hcl[0]-45;
        r = r<0? 360+r:r;
        r = 100-Math.abs(Math.abs(r-180)-90)
        amp = sigmoid(r)-1//(Math.sin(r*Math.PI/180)+1)/2;
        dir = dir * amp - 1;
        for (var i=1;i<=3;i++) {
            s = shade(s,dir);
            t = tint(t,dir);
            color['shade'+i] = Object(rgb2hex(lab2rgb(hcl2lab(s))));
            color['shade'+i].text = textcolor(s);
            color['tint'+i] = Object(rgb2hex(lab2rgb(hcl2lab(t))));
            color['tint'+i].text = textcolor(t);
        }
        for (var i=2;i<=3;i++) {
            color['shade'+i].hover = color['shade'+i-1];
            color['tint'+i].hover = color['tint'+i-1];
        }
        color.text = textcolor(hcl);
        color.hover = hcl[2]<65 ? color['tint'+1] : color['shade'+1]
        color['shade'+1].hover = base;
        color['tint'+1].hover = base;
        return color;
    }

    function makeColorPalette(hexDict) {
        var palette = {};
        for (var [key,value] of Object.entries(hexDict)) if (!key.startsWith('$')) palette[key] = makeColor(value);
        palette['none'] = Object('');
        for (var i=1;i<=3;i++) {
            palette['none']['shade'+i] = '';
            palette['none']['shade'+i].text = '';
            palette['none']['shade'+i].hover = '';
            palette['none']['tint'+i] = '';
            palette['none']['tint'+i].text = '';
            palette['none']['tint'+i].hover = '';
        }
        return palette;
    }

    function makeColorTheme(colorDict, palette) {
        for (var [key,value] of Object.entries(colorDict)) {
            if (key.startsWith('$')) continue;
            if (value.startsWith('#')) colorDict[key] = makeColor(value);
            else colorDict[key] = palette[value];
        }
        if (!Object.keys(colorDict).includes('primary')) colorDict.primary = palette.black;
        if (!Object.keys(colorDict).includes('secondary')) colorDict.secondary = colorDict.primary;
        if (!Object.keys(colorDict).includes('neutral')) colorDict.neutral = palette.grey;
        if (!Object.keys(colorDict).includes('info')) colorDict.info = palette.blue;
        if (!Object.keys(colorDict).includes('success')) colorDict.success = palette.green;
        if (!Object.keys(colorDict).includes('warning')) colorDict.warning = palette.yellow;
        if (!Object.keys(colorDict).includes('error')) colorDict.error = palette.red;
        if (!Object.keys(colorDict).includes('light')) colorDict.light = palette.white;
        if (!Object.keys(colorDict).includes('dark')) colorDict.dark = palette.black;
        var theme = {};
        for (var [key,value] of Object.entries(colorDict)) if (!key.startsWith('$')) theme[key] = makeColor(value);
        return theme;
    }

    var DEVICE = {
        isMobile: function() {return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)},
        isDesktop: function() {return !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)},
    };

    class DefaultDict {
        constructor(defaultInit) {
            return new Proxy({}, {
                get: (target, name) => name in target ? target[name] : (target[name] = _.isFunction(defaultInit) ? new defaultInit().valueOf() : defaultInit)
            })
        }
    }

    juice.eventListeners = new DefaultDict(Array);
    juice.addEventListener = function(event, fx, ...context) {
        juice.eventListeners[event].push([fx,context]);
    }
    juice.dispatchEvent = function(event) {
        for (var [fx,context] of juice.eventListeners[event]) fx.call(...context);
    }

    juice.def = function(componentClass) {
        juice.graph = new Graph();
        var proxy = new Proxy({}, {
            get: function(target, fx, receiver) {
                return function(...args) {
                    juice.graph.appendNode(fx,args);
                    juice.graph.tip.errorstack = new Error().stack;
                    return proxy;
                }
            }
        });
        proxy.def(componentClass).css('width:100vw;height:100vh;flex-direction:row;');
        window.onload = function() {
            var t0 = performance.now();
            document.body.style.cssText = 'padding:0px;margin:0px;font-family:'+juice.theme.font.family+';font-size:'+juice.theme.font.size+'px;';
            juice.graph.render();
            juice.dispatchEvent('load');
            var t1 = performance.now();
            console.log("Rendering page took " + Math.floor((t1 - t0)*100)/100 + " milliseconds.");
        };
        return proxy;
    };

    juice.templates = {};
    var active_template = undefined;
    juice.template = function(name) {
        var graph = new Graph();
        graph.appendNode('map');
        var proxy = new Proxy({}, {
            get: function(target, fx, receiver) {
                return function(...args) {
                    graph.appendNode(fx,args);
                    return proxy;
                }
            }
        });
        active_template = name;
        juice.templates[name] = graph;
        return proxy;
    };

    class TemplateItem {
        constructor(template, key) {
            this.template = template;
            this.key = key;
        }
    }

    juice.$template = new Proxy({}, {
        get: function (target, prop, receiver) {
            return new TemplateItem(active_template,prop);
        },
    });

    class DataArrayItem {
        constructor(data, level=0) {
            this.$data = data;
            if (level<1) this[['$j','$k'][level]] = new DataArrayItem(data, level+1);
        }
    }

    juice.data = function(data) {
        if (!_.isObject(data)) data = Object(data);
        data.$events = new DefaultDict(Array);
        data.$dispatchEvent = function(event) {
            for (var [fx,context] of this.$events[event]) fx.call(...context);
            for (var [fx,context] of this.$events['any']) fx.call(...context);
        }
        data.$addEventListener = function(event,fx,...context) {
            if (!this.$events[event].some((f,c) => f == fx && c.every( (v,i) => v === context[i] ))) this.$events[event].push([fx,context]);
        }
        if (Array.isArray(data)) {
            data.$i = new DataArrayItem(data);
        }
        var proxy = new Proxy(data, {
            set: function(obj, prop, value) {
                if (!prop.startsWith('$') && Array.isArray(value)) data[prop] = new Proxy(data[prop], {
                    apply: function(target, thisArg, argumentsList) {
                        data.$dispatchEvent('change');
                        data.$dispatchEvent('change:'+prop);
                        return thisArg[target].apply(this, argumentList);
                    },
                    deleteProperty: function(target, property) {
                        delete target[property];
                        data.$dispatchEvent('change');
                        data.$dispatchEvent('change:'+prop);
                        return true;
                    },
                    set: function(target, property, value, receiver) {
                        if (!_.isObject(value)) value = Object(value);
                        var oldValue = target[property];
                        target[property] = value;
                        if (oldValue != value) data.$dispatchEvent('change');
                        if (oldValue != value) data.$dispatchEvent('change:'+prop);
                        return true;
                    },
                });
                if (!_.isObject(value)) value = Object(value);
                var oldValue = obj[prop];
                obj[prop] = value;
                if (!prop.startsWith('$') && oldValue != value) data.$dispatchEvent('change');
                if (!prop.startsWith('$') && oldValue != value) data.$dispatchEvent('change:'+prop);
                return true;
            },
            get: function (target, prop, receiver) {
                if (prop == '$length') return Math.max(...Object.entries(target).map(([k,v]) => Array.isArray(v) ? v.length : 1));
                else if (Object.getOwnPropertyNames(target).includes(prop) && !prop.startsWith('$')) {
                    var obj = Object(target[prop]);
                    obj.$data = target;
                    obj.$key = prop;
                    return obj;
                } else return target[prop];
            },
        });
        for (const [key, value] of Object.entries(data)) proxy[key] = value;
        proxy.$data = data;
        proxy.$update = function(otherData) {
            for (const [key, value] of Object.entries(otherData)) if (!key.startsWith('$')) this[key] = value;
        };
        return proxy;
    };

    var DEVICE = juice.data({
        width: undefined,
        height: undefined,
        isMobile: undefined,
        isDesktop: undefined,
        check: ()=>{
            DEVICE.width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
            DEVICE.height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
            DEVICE.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            DEVICE.isDesktop = !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        }
    });
    window.addEventListener('resize', DEVICE.check);
    DEVICE.check();


    juice.signal = {};
    juice.slot = {};
    juice.theme = juice.data({});
    /*
    juice.theme.$addEventListener('change:palette', ()=>{
        if (_.isString(juice.theme.palette)) juice.theme.palette = makeColorPalette(juice.theme.palette);
        juice.theme.color = makeColorTheme(juice.theme.color || {}, juice.theme.palette);
    })
    */

    juice.setTheme = function(theme) {
        if (_.isString(theme)) theme = THEMES[theme];
        if (_.isObject(theme)) for (var [key,value] of Object.entries(theme)) juice.theme[key] = value;
        juice.theme.palette = makeColorPalette(juice.theme.palette);
        juice.theme.color = makeColorTheme(juice.theme.color || {}, juice.theme.palette);
        if (document.readyState === 'complete') juice.graph.root.rendered_item.theme(juice.theme);
        else juice.addEventListener('load', ()=> juice.graph.root.rendered_item.theme(juice.theme));
    }

    class Node {
        constructor(fx, args) {
            this.fx = fx;
            this.args = args;
            this.scope = {};
            this.after = undefined;
            this.branch = undefined;
            this.branch_closed = false;
            this.rendered = false;
            this.rendered_item = undefined;
            this.conditions = [];
            this.conditionNodes = [];
            this.conditionState = undefined;
            this.events = new DefaultDict(Array);
            this.dispatch_batch = new Set();
            this.dispatch_timer = undefined;
            this.data = juice.data({
                width: undefined,
                height: undefined,
            });
        }

        updateDimensions() {
            if (!this.rendered_item) return;
            var bounds = this.rendered_item.div.getBoundingClientRect();
            this.data.width = bounds.width;
            this.data.height = bounds.height;
        }

        dispatchEvent(event) {
            if (this.dispatch_timer === undefined) this.dispatch_timer = window.setTimeout(()=>{
                for (var event of this.dispatch_batch) {
                    for (var [fx,context] of this.events[event]) fx.call(...context);
                    for (var [fx,context] of this.events['any']) fx.call(...context);
                }
                this.dispatch_batch = new Set();
                this.dispatch_timer = undefined;
            }, 20);
            this.dispatch_batch.add(event);
        }

        addEventListener(event,fx,...context) {
            if (!this.events[event].some(([f,c]) => f == fx && c.every( (v,i) => v === context[i] ))) this.events[event].push([fx,context]);
        }

        append(node) {
            if (node.fx == 'slot') juice.slot[node.args[0]] = this;

            if (['def','page'].includes(this.fx) && !this.branch_closed) node.scope.dom = this;
            else node.scope.dom = this.scope.dom;

            if (node.fx == 'if') node.scope.if = node;
            else node.scope.if = this.scope.if;
            if (['if','elif','else'].includes(node.fx)) node.scope.if.conditionNodes.push(node);

            if (['elif','else'].includes(node.fx)) {
                this.scope.graph.branch_closed = true;
                this.scope.graph.after = node;
                node.scope.graph = node;
                return node;
            }

            if (['def','if','elif','else','map','repeat','page'].includes(this.fx) && !this.branch_closed) {
                node.scope.graph = this;
                this.branch = node;
            } else {
                node.scope.graph = this.scope.graph;
                this.after = node;
            }
            if (node.fx == 'end') {
                this.scope.graph.branch_closed = true;
                return this.scope.graph;
            } else return node;
        }

        ravel() {
            var chain = [];
            var rootNode = this;
            function addNode(node) {
                chain.push([node.fx,node.args]);
                if (node.branch != undefined) addNode(node.branch);
                if (node.after != undefined && node != rootNode) addNode(node.after);
            }
            addNode(rootNode);
            return chain;
        }

        clone() {
            var chain = this.ravel();
            return this.fromChain(chain);
        }

        fromChain(chain) {
            var clone_root = undefined;
            var clone_tip = undefined;
            for (var [fx,args] of chain) {
                var node = new Node(fx,args);
                if (clone_root === undefined && clone_tip === undefined) {
                    clone_root = node;
                    clone_tip = node;
                } else clone_tip = clone_tip.append(node);
            }
            return clone_root;
        }

        render() {
            if (this.scope.dom != undefined && !this.scope.dom.rendered) this.scope.dom.render();
            if (this.rendered) return;
            this.rendered = true;
            if (this.fx == 'def') this.addNewItem();
            else if (this.fx == 'if') {
                for (var node of this.conditionNodes) this.installCondition(node);
                this.checkConditions();
            } else if (this.fx == 'map') {
                var data = this.args[0];
                if (!data.$data) data = juice.data(data);
                var template = this.template;
                for (var i=0; i<data.$length; i++) {
                    var chain = this.branch.ravel().map(([fx,args]) => {
                        var datapiece = args[0];
                        if (!!datapiece && datapiece === juice.$template) return [fx,[data.$data]]
                        if (!!datapiece && datapiece instanceof TemplateItem && datapiece.template == template) datapiece = data[datapiece.key];
                        if (!!datapiece && datapiece instanceof DataArrayItem && datapiece.$data == data.$data) return [fx,[datapiece.$data[i]]];
                        if (!!datapiece && datapiece.$data === data.$data) {
                            if (datapiece.$key) datapiece = datapiece.$data[datapiece.$key];
                            if (Array.isArray(datapiece)) return [fx,[datapiece[i]]];
                            else if (datapiece && _.isFunction(datapiece)) return [fx,[datapiece(i,_.slice(data, i))]];
                            else return [fx,[datapiece]];
                        } else return [fx,args];
                    });
                    var node = this.fromChain(chain);
                    node.scope.dom = this.scope.dom;
                    node.render();
                }
                if (data.$data) data.$addEventListener('change',this.rerender, this);
            } else if (this.fx == 'repeat') {
                var arg = this.args[0];
                if (arg.$data && arg.$key) var repeats = arg.$data[arg.$key];
                else var repeats = arg;
                for (var i=0; i<repeats; i++) {
                    var node = this.branch.clone();
                    node.scope.dom = this.scope.dom;
                    node.render();
                }
                if (arg.$data) arg.$data.$addEventListener('change',this.rerender, this);
            } else if (this.fx == 'page') {
                var name = this.args[0];
                this.fx = 'def';
                this.args = ['page'];
                this.rendered = false;
                this.render();
                this.scope.dom.rendered_item._pages[name] = this.rendered_item;
                this.scope.dom.rendered_item._page_order.push(name);
                this.scope.dom.rendered_item.setPage(name);
                return;
            } else if (['end','else','elif','slot'].includes(this.fx)) {
                // do  nothing
            } else if (Object.keys(juice.templates).includes(this.fx)) {
                var name = this.fx;
                var data = this.args[0];
                var graph = juice.templates[name].root.clone();
                graph.args = [data];
                graph.template = name;
                graph.scope.dom = this.scope.dom;
                graph.render();
            } else {
                if (!(this.fx in this.scope.dom.rendered_item)) throw 'Node <'+this.scope.dom.args[0]+'> has no method .'+this.fx+'()\n'+this.errorstack;
                this.scope.dom.rendered_item[this.fx](...this.args);
            }
            if (this.after !== undefined) this.after.render();
        }

        unrender() {
            if (!this.rendered) return;
            if (this.fx == 'def') {
                if (this.scope.dom === undefined) document.body.removeChild(this.rendered_item.div);
                else this.scope.dom.rendered_item.div.removeChild(this.rendered_item.div);
                this.rendered_item.resizeObserver.disconnect();
                this.rendered_item.resizeObserver = undefined;
                this.rendered_item = undefined;
                function propagate(node) {
                    node.rendered = false;
                    if (node.branch !== undefined) propagate(node.branch);
                    if (node.after !== undefined) propagate(node.after);
                }
                propagate(this);
            } else this.scope.dom.unrender();
        }

        rerender() {
            this.unrender();
            this.render();
        }

        addNewItem() {
            if (this.args[0] === undefined) {
                var item = new juice.Item();
                item.node = this;
                item.div.setAttribute('juice-component-class','Item');
            } else {
                var className = this.args[0][0].toUpperCase() + this.args[0].slice(1).toLowerCase();
                if (!component.hasOwnProperty(className)) throw 'Component class "'+className+'" was not found.';
                var item = new component[className]();
                item.node = this;
                item.data = this.data;
                item.div.setAttribute('juice-component-class',className);
                item.init();
            }
            var self = this;
            item.resizeObserver = new ResizeObserver(()=>{self.dispatchEvent('resize');});
            this.addEventListener('resize',this.updateDimensions, this)
            item.resizeObserver.observe(item.div);
            this.rendered_item = item;
            if (this.scope.dom === undefined) document.body.appendChild(item.div);
            else {
                this.scope.dom.rendered_item.div.appendChild(item.div);
                item.div.style.flexDirection = this.scope.dom.rendered_item.div.style.flexDirection;
            }
            if (this.branch !== undefined) this.branch.render();
        }

        installCondition(conditionalNode) {
            var condition = conditionalNode.args[0];
            var target_node = this;
            function parse(expression) {
                expression = expression.replace(/\s/g,'');
                var operators = {
                    '==': (a,b)=>()=>a()==b(),
                    '!=': (a,b)=>()=>a()!=b(),
                    '>=': (a,b)=>()=>a()>=b(),
                    '<=': (a,b)=>()=>a()<=b(),
                    '>': (a,b)=>()=>a()>b(),
                    '<': (a,b)=>()=>a()<b(),
                };
                var logic = {
                    '!': (a)=>()=>!a(),
                    '||': (a,b)=>()=>a()||b(),
                    '&&': (a,b)=>()=>a()&&b(),
                };
                function parse_object(obj) {
                    if (!isNaN(parseFloat(obj))) return ()=>parseFloat(obj);
                    else if (obj == 'true') return ()=>true;
                    else if (obj == 'false') return ()=>false;
                    var keys = obj.split('.');
                    var obj = keys.shift();
                    if (obj=='this') var target = target_node.scope.dom.data;
                    else if (obj=='parent') var target = target_node.scope.dom.scope.dom.data;
                    else if (obj=='slot') var target = juice.slot[keys.shift()];
                    else if (obj=='device') var target = DEVICE;
                    else var target = window[obj];
                    var fx = ()=> {var root = target;for (var k of keys) root = root[k];return root};
                    target.$addEventListener('change',target_node.checkConditions, target_node);
                    return fx;
                }
                function split(part) {
                    var par = 0;
                    var terms = [];
                    var term = '';
                    for (var i=0;i<part.length;i++) {
                        var char = part[i];
                        if (char == '(') {
                            if (term != '' && par == 0) {
                                terms.push(term);
                                term = '';
                            }
                            if (par != 0) term += char;
                            par += 1;

                        } else if (char == ')') {
                            par -= 1;
                            if (par != 0) term += char;
                            if (term != '' && par == 0) {
                                terms.push(term);
                                term = '';
                            }
                        } else if (['&','|'].includes(char) && par == 0) {
                            if (part[i+1]==char) {
                                i++;
                                if (term != '') terms.push(term);
                                terms.push(char.repeat(2));
                                term = '';
                            }
                        } else term += char;
                    }
                    if (terms.length == 0) {
                        for (const [op,fx] of Object.entries(operators)) {
                            var ab = term.split(op);
                            if (ab != term) {
                                var [a,b] = ab;
                                if (op == '!' && b[0] != '=') term = logic['!'](parse_object(b));
                                else term = fx(parse_object(a),parse_object(b));
                                break;
                            }
                        }
                        if (_.isString(term)) term = parse_object(term);
                    }
                    if (term != '') terms.push(term);
                    for (var t=0;t<terms.length;t++) if (_.isString(term) && !Object.keys(logic).includes(terms[t])) terms[t] = split(terms[t]);
                    for (var op of ['!','&&','||']) { // order determines precedence
                        while (terms.includes(op)) {
                            var i = terms.indexOf(op);
                            if (op == '!') terms.splice(i,2,logic[op](terms[i+1]));
                            else terms.splice(i-1,3,logic[op](terms[i-1],terms[i+1]));
                        }
                    }
                    return terms[0];
                }
                return split(expression);
            }
            var fx = condition ? parse(condition) : undefined;
            this.conditions.push({node: conditionalNode, fx: fx});
        }

        checkConditions() {
            var else_condition = undefined;
            var true_condition = undefined;
            for (var condition of this.conditions) {
                if (condition.node.fx == 'else') else_condition = condition.node.branch;
                else if (condition.fx()) {
                    true_condition = condition.node.branch;
                    break;
                }
            }
            var new_condition = true_condition || else_condition;
            if (this.conditionState != new_condition) {
                if (this.conditionState !== undefined) this.conditionState.unrender();
                this.conditionState = new_condition;
                new_condition.render();
            }
        }
    }

    class Graph {
        constructor(arr) {
            this.root = undefined;
            this.tip = undefined;
            if (arr !== undefined) for (var [fx,args] of arr) this.appendNode(fx,args);
        }

        render(node) {
            if (node === undefined) node = this.root;
            node.render();
        }

        appendNode(fx,args) {
            var node = new Node(fx,args);
            if (this.root === undefined && this.tip === undefined) {
                this.root = node;
                this.tip = node;
            } else this.tip = this.tip.append(node);
        }
    };


    juice.Item = class {

        constructor() {
            this.div = document.createElement('div');
            this.div.style.cssText = 'display:flex;box-sizing:border-box;overflow:hidden;';
            this.state = juice.data({});

            //this.div.style.setProperty('--color-light','#eee');
            //this.div.style.setProperty('--color-dark','#333');
            //this.div.style.setProperty('--color','red');
            this.div.style.setProperty('--item-size-unit','30');
            this.div.style.setProperty('--border-width','2px');
            this.div.style.setProperty('--corner-radius','2px');
            return

            var css_variables = {
                'item-color': 'theme-color-primary',
                'item-color-background': 'theme-color-background',
                'item-color-foreground': 'theme-color-foreground',
                'item-color-light': 'theme-color-light',
                'item-color-dark': 'theme-color-dark',
                'item-color-contour': 'theme-color-contour',
                'item-style-border-radius': 'theme-style-border-radius',
                'item-style-border-width': 'theme-style-border-width',
                'item-style-shadow': 'theme-style-shadow',
                'item-style-backdrop': 'theme-style-backdrop',
                'item-font-family': 'theme-font-family',
                'item-font-size': 'theme-font-size',
                'item-font-light': 'theme-font-light',
                'item-font-dark': 'theme-font-dark',
                'item-size-border': 'theme-size-border',
                'item-size-radius': 'theme-size-radius',
                'item-size-unit': 'theme-size-unit',
            };
            Object.entries(css_variables).forEach(([key, value])=>this.div.style.setProperty('--'+key,'var(--'+css_variables[key]+')'));
            for (const subkey of ['tint3','tint2','tint1','shade1','shade2','shade3']) this.div.style.setProperty('--item-color-'+subkey, 'var(--theme-color-primary-'+subkey+')');
            for (const subkey of ['tint3','tint2','tint1','shade1','shade2','shade3']) this.div.style.setProperty('--item-color-light-'+subkey, 'var(--theme-color-light-'+subkey+')');
            for (const subkey of ['tint3','tint2','tint1','shade1','shade2','shade3']) this.div.style.setProperty('--item-color-dark-'+subkey, 'var(--theme-color-dark-'+subkey+')');
            for (const subkey of ['tint3','tint2','tint1','shade1','shade2','shade3']) this.div.style.setProperty('--item-color-background-'+subkey, 'var(--theme-color-background-'+subkey+')');
            for (const subkey of ['tint3','tint2','tint1','shade1','shade2','shade3']) this.div.style.setProperty('--item-color-foreground-'+subkey, 'var(--theme-color-foreground-'+subkey+')');
        }

        _set_css_variables(theme, prefix) {
            //style
            var div = this.div;
            function set_style_properties(style) {
                var styles = style.split(' ');
                if (styles.length == 1) {
                    if (style == 'flat') div.style.setProperty('--'+prefix+'-style-border-width','0px');
                    else if (style == 'border') div.style.setProperty('--'+prefix+'-style-border-width','var(--item-size-border)');
                    else if (style == 'round') div.style.setProperty('--'+prefix+'-style-border-radius','999px');
                    else if (style == 'rounded') div.style.setProperty('--'+prefix+'-style-border-radius','10px');
                    else if (style == 'rect') div.style.setProperty('--'+prefix+'-style-border-radius','var(--item-size-radius)');
                    else if (style == 'sharp') div.style.setProperty('--'+prefix+'-style-border-radius','0px');
                    else if (style == 'shadow') div.style.setProperty('--'+prefix+'-style-shadow','0px 0px 3px var(--item-color-contour)');
                    else if (style == 'neumorph-up') div.style.setProperty('--'+prefix+'-style-shadow','5px 5px 10px var(--item-color-background-shade1), -5px -5px 10px var(--item-color-background-tint1)');
                    else if (style == 'neumorph-down') div.style.setProperty('--'+prefix+'-style-shadow','inset 5px 5px 10px var(--item-color-background-shade1), inset -5px -5px 10px var(--item-color-background-tint1)');
                    else if (style == 'glass') {
                        div.style.setProperty('--'+prefix+'-color-background','rgba(255,255,255,0.4)');
                        div.style.setProperty('--'+prefix+'-style-backdrop','blur(4px)');
                    }
                    else if (style == 'light') {
                        div.style.setProperty('--'+prefix+'-color-background','var(--'+prefix+'-color-light)');
                        for (const subkey of ['tint3','tint2','tint1','shade1','shade2','shade3']) div.style.setProperty('--'+prefix+'-color-background-'+subkey, 'var(--'+prefix+'-color-light-'+subkey+')');
                        div.style.setProperty('--'+prefix+'-color-foreground','var(--'+prefix+'-color-dark)');
                        for (const subkey of ['tint3','tint2','tint1','shade1','shade2','shade3']) div.style.setProperty('--'+prefix+'-color-foreground-'+subkey, 'var(--'+prefix+'-color-dark-'+subkey+')');
                        if (!theme['style'].includes('colorcontour')) div.style.setProperty('--'+prefix+'-color-contour','var(--'+prefix+'-color-dark)');
                    }
                    else if (style == 'dark') {
                        div.style.setProperty('--'+prefix+'-color-background','var(--'+prefix+'-color-dark)');
                        for (const subkey of ['tint3','tint2','tint1','shade1','shade2','shade3']) div.style.setProperty('--'+prefix+'-color-background-'+subkey, 'var(--'+prefix+'-color-dark-'+subkey+')');
                        div.style.setProperty('--'+prefix+'-color-foreground','var(--'+prefix+'-color-light)');
                        for (const subkey of ['tint3','tint2','tint1','shade1','shade2','shade3']) div.style.setProperty('--'+prefix+'-color-foreground-'+subkey, 'var(--'+prefix+'-color-light-'+subkey+')');
                        if (!theme['style'].includes('colorcontour')) div.style.setProperty('--'+prefix+'-color-contour','var(--'+prefix+'-color-light)');
                    }
                    else if (style == 'colorfill') {
                        div.style.setProperty('--'+prefix+'-color-background','var(--item-color)');
                        for (const subkey of ['tint3','tint2','tint1','shade1','shade2','shade3']) div.style.setProperty('--'+prefix+'-color-background-'+subkey, 'var(--item-color-'+subkey+')');
                        div.style.setProperty('--'+prefix+'-color-foreground','var(--item-color-text)');
                    }
                    else if (style == 'colorcontour') {
                        div.style.setProperty('--'+prefix+'-color-foreground','var(--item-color)');
                        for (const subkey of ['tint3','tint2','tint1','shade1','shade2','shade3']) div.style.setProperty('--'+prefix+'-color-foreground-'+subkey, 'var(--item-color-'+subkey+')');
                        div.style.setProperty('--'+prefix+'-color-contour','var(--item-color)');
                        for (const subkey of ['tint3','tint2','tint1','shade1','shade2','shade3']) div.style.setProperty('--'+prefix+'-color-contour-'+subkey, 'var(--item-color-'+subkey+')');
                    }
                    else throw new Error('Style '+style+' not known.');
                } else styles.forEach(style => set_style_properties(style));
            }
            set_style_properties(theme['style']);
            // color
            for (const key in theme['color']) {
                div.style.setProperty('--'+prefix+'-color-'+key, theme['color'][key]);
                for (const subkey of ['tint3','tint2','tint1','shade1','shade2','shade3']) div.style.setProperty('--'+prefix+'-color-'+key+'-'+subkey, theme['color'][key][subkey]);
            }
            // font
            for (const key in theme['font']) if (!key.startsWith('$')) div.style.setProperty('--'+prefix+'-font-'+key, theme['font'][key]);
            // size
            for (const key in theme['size']) if (!key.startsWith('$')) div.style.setProperty('--'+prefix+'-size-'+key, theme['size'][key]);
        }

        color(string) {
            var color = string.startsWith('#') ? makeColor(string) : juice.theme.palette[string];
            this.div.style.setProperty('--color', color);
            for (const subkey of ['tint3','tint2','tint1','shade1','shade2','shade3']) this.div.style.setProperty('--color-'+subkey, color[subkey]);
            return this;
        }

        theme(theme) {
            (['border','rounded','round','colorfill']).forEach((style)=>this.div.style.setProperty('--'+style,'unset'));
            // color
            for (const key in theme['color']) {
                this.div.style.setProperty('--color-'+key, theme['color'][key]);
                for (const subkey of ['tint3','tint2','tint1','shade1','shade2','shade3']) this.div.style.setProperty('--color-'+key+'-'+subkey, theme['color'][key][subkey]);
            }
            this.style(theme.style);
            return
            var css_variables = {
                'theme-style-border-radius': '0px',
                'theme-style-border-width': '0px',
                'theme-style-shadow': 'none',
                'theme-style-backdrop': 'none',
            };
            Object.entries(css_variables).forEach(([key, value])=>this.div.style.setProperty('--'+key,css_variables[key]));
            this._set_css_variables(theme, 'theme');
            return this;
        }

        style(string) {
            this.div.style.cssText += '\
            --dark-toggle: var(--dark) var(--color-dark);\
            --colorfill-toggle: var(--colorfill) var(--color);\
            --glass-toggle: var(--glass) rgba(255,255,255,0.4);\
            --background-color: var(--glass-toggle, var(--colorfill-toggle, var(--dark-toggle, var(--color-light))));\
            background-color: var(--background-color);\
            backdrop-filter: var(--glass) blur(4px);\
            \
            --dark-toggle-shade: var(--dark) var(--color-dark-shade1);\
            --colorfill-toggle-shade: var(--colorfill) var(--color-shade1);\
            --background-color-shade: var(--colorfill-toggle-shade, var(--dark-toggle-shade, var(--color-light-shade1)));\
            \
            --dark-toggle-tint: var(--dark) var(--color-dark-tint1);\
            --colorfill-toggle-tint: var(--colorfill) var(--color-tint1);\
            --background-color-tint: var(--colorfill-toggle-tint, var(--dark-toggle-tint, var(--color-light-tint1)));\
            \
            --light-toggle: var(--dark) var(--color-light);\
            --colorcontour-toggle: var(--colorcontour) var(--color);\
            --foreground-color: var(--colorcontour-toggle, var(--light-toggle, var(--color-dark)));\
            color: var(--foreground-color);\
            \
            --border-toggle: var(--border) var(--border-width);\
            border:var(--border-toggle,0px) solid var(--foreground-color);\
            \
            --round-toggle: var(--round) 99999px;\
            --rounded-toggle: var(--rounded) calc(4 * var(--corner-radius));\
            --sharp-toggle: var(--sharp) 0px;\
            border-radius: var(--sharp-toggle, var(--rounded-toggle, var(--round-toggle, var(--corner-radius))));\
            \
            --shadow-toggle: var(--shadow) 0px 0px 3px var(--foreground-color);\
            \
            --neumorph-up-toggle: var(--neumorph-up) 5px 5px 10px var(--background-color-shade), -5px -5px 10px var(--background-color-tint);\
            --neumorph-down-toggle: var(--neumorph-down) inset 5px 5px 10px var(--background-color-shade), inset -5px -5px 10px var(--background-color-tint);\
            box-shadow: var(--neumorph-up-toggle, var(--neumorph-down-toggle, var(--shadow-toggle, none)));\
            \
            '
            if (string != undefined) string.split(' ').forEach((style)=>this.div.style.setProperty('--'+style, ' '));
            return this
            this._init_css_variables();
            if (string != undefined) this._set_css_variables({'style':string}, 'item');
            return this;
        }

        _isPortrait() {
            if (this.div.getBoundingClientRect().height > this.div.getBoundingClientRect().width) return true;
            else return false;
        }

        _isLandscape() {
            if (this.div.getBoundingClientRect().height < this.div.getBoundingClientRect().width) return true;
            else return false;
        }

        _parse_size_string(string, query) {
            if (string == 'fill') {
                if (this._parent == undefined) {
                    this.div.style.flex = '1';
                    string = '';
                } else {
                    if (this._parent._flow.includes('column') && query == 'height') {
                        this.div.style.flex = '1';
                        string = '';
                    } else if (this._parent._flow.includes('row') && query == 'width') {
                        this.div.style.flex = '1';
                        string = '';
                    } else string = '100%';
                }
            } else if (string == 'square') {
                throw new Error('Not implemented yet.')
                string = '';
                //if (query == 'height') string = this._width;
                //else if (query == 'width') string = this._height;
            } else {
                if (string[0] == '-') string = '100%'+string;
                if (string[0] == '/') string = '100%'+string;
                if (string.includes('-')) string = string.replace(/-/, ' - ');
                if (string.includes('u')) string = string.replace(/u/, 'px * var(--item-size-unit)');
                string += ' + 0.5px'; // hack to avoid shaking on css transition as per https://stackoverflow.com/questions/53094304/inner-div-oscillates-when-using-a-css-transition-on-the-parent-div
            }
            return string;
        }

        _parse_font_size(string) {
            if (string == '' || string == 'normal') return '12px';
            else if (string == 'big') return '16px';
            else if (string == 'verybig') return '22px';
            else if (string == 'huge') return '34px';
            else if (string == 'enormous') return '72px';
            else if (string == 'small') return '10px';
            else if (string == 'verysmall') return '9px';
            else if (string == 'tiny') return '7px';
            else return string;
        }

        width(string) {
            var size = this._parse_size_string(string, 'width');
            this._width = size;
            this.div.style.width = 'calc('+size+')';
            return this;
        }

        height(string) {
            var size = this._parse_size_string(string, 'height');
            this._height = size;
            this.div.style.height = 'calc('+size+')';
            return this;
        }

        flow(string) {
            var format = 'row';
            var dict = {
                'topdown': 'column',
                'bottomup': 'column-reverse',
                'leftright': 'row',
                'rightleft': 'row-reverse',
                'td': 'column',
                'bu': 'column-reverse',
                'lr': 'row',
                'rl': 'row-reverse'
            }
            if (!dict.hasOwnProperty(string)) console.log('Warning: Invalid flow property. Using default "leftright".');
            else format = dict[string];
            this.div.style.flexDirection = format;
            this._flow = format;
            return this;
        }

        link(slot) {
            juice.slot[slot].data.$addEventListener('change:state', this.data.$update, this.data, juice.slot[slot].data);
            return this;
        }

        sync(slot) {
            juice.slot[slot].data.$addEventListener('change:state', this.data.$update, this.data, juice.slot[slot].data);
            this.data.$addEventListener('change:state', juice.slot[slot].data.$update, juice.slot[slot].data, this.data);
            return this;
        }

        space(string) { // TODO: replace with flex gap
            if (string == 'between') this.div.style.justifyContent = 'space-between';
            else if (string == 'evenly') this.div.style.justifyContent = 'space-evenly';
            else if (string == 'around') this.div.style.justifyContent = 'space-around';
            else if (string == 'center') this.div.style.justifyContent = 'center';
            else this.div.style.justifyContent = 'space-evenly';
            return this;
        }

        align(string) {
            if (string == 'center') this.div.style.alignItems = 'center';
            else if (string == 'left' || string == 'top') this.div.style.alignItems = 'flex-start';
            else if (string == 'right' || string == 'bottom') this.div.style.alignItems = 'flex-end';
            return this;
        }

        gap(string) {
            if (string.includes('u')) string = 'calc('+string.replace(/u/, 'px * var(--item-size-unit)')+')';
            this.div.style.gap = string;
            return this;
        }

        pad(string) {
            if (string.includes('u')) string = 'calc('+string.replace(/u/, 'px * var(--item-size-unit)')+')';
            this.div.style.padding = string;
            return this;
        }

        padgap(string) {
            this.pad(string);
            this.gap(string);
            return this;
        }

        margin(string) {
            if (string.includes('u')) string = 'calc('+string.replace(/u/, 'px * var(--item-size-unit)')+')';
            this.div.style.margin = string;
            return this;
        }

        on(event, signal, ...args) {
            if (_.isFunction(signal)) this.div.addEventListener(event, signal);
            else this.div.addEventListener(event, function(e){juice.signal[signal](e,...args)});
            return this;
        }

        opacity(number) {
            this.div.style.opacity = number;
            return this;
        }

        hcenter() {
            return this.center('horizontally');
        }

        vcenter() {
            return this.center('vertically');
        }

        center(string) {
            if (string == 'off') this.div.style.margin = '';
            else if (string == undefined) this.div.style.margin = 'auto';
            else if (string == 'vertically') this.div.style.margin = 'auto 0';
            else if (string == 'horizontally') this.div.style.margin = '0 auto';
            return this;
        }

        wrap(string) {
            if (string == 'off') this.div.style.flexWrap = '';
            else if (string == undefined) this.div.style.flexWrap = 'wrap';
            return this;
        }

        css(string) {
            this.div.style.cssText += string;
            return this;
        }

    }

}(window.juice = window.juice || {}));

$template = juice.$template;
juice.setTheme('apple');
