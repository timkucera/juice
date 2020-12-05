(function(juice, undefined) {

    juice.color = _COLOR.dull;
    juice.gridsize = 30;

    juice.signal = {};
    juice.slot = {};

    juice.theme = {
        style: 'flat',
    };

    juice.device = {
        isMobile: function() {return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)},
        isDesktop: function() {return !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)},
    };

    juice.def = function() {
        var w = new juice.Item();
        w.div.style.width = '100vw';
        w.div.style.height = '100vh';
        w.div.style.flexDirection = 'row';
        w._parent = document.body;
        window.onload = function() {
            document.body.style.cssText = 'padding:0px;margin:0px;';
            document.body.appendChild(w.div);
        };
        return w;
    };

    class DefaultDict {
        constructor(defaultInit) {
            return new Proxy({}, {
                get: (target, name) => name in target ?
                    target[name] :
                    (target[name] = typeof defaultInit === 'function' ?
                    new defaultInit().valueOf() :
                    defaultInit)
            })
        }
    }

    class Condition {
        constructor(string, caller) {
            var fx = this.parse(string, caller);
            if (fx === undefined) throw '.if() condition "'+string+'" invalid.';
            this.fx = [fx];
            this.state = undefined;
            this.dispatch = { // 0 = if, -1 = else, 1+ = elif
                true:{'0': [], '-1':[]},
                false:{'0': [], '-1':[]}
            };
            this.hasElse = false;
            this.active_index = 0;
        }

        parse(string, caller) {

            function grammar_1(object, is, orientation) {
                if (object == 'this') var obj = caller;
                else if (object == 'parent') var obj = caller._parent;
                else if (object == 'device') var obj = juice.device;
                else if (object in juice.slot) var obj = juice.slot[object];
                else return undefined;
                if (orientation == 'landscape') return function() {return obj._isLandscape();}
                else if (orientation == 'portrait') return function() {return obj._isPortrait();}
                else if (orientation == 'mobile' && object == 'device') return function() {return obj.isMobile();}
                else if (orientation == 'desktop' && object == 'device') return function() {return obj.isDesktop();}
                else return undefined;
            }

            function grammar_2(property, of, object, operator, size) {
                if (object == 'this') var obj = caller;
                else if (object == 'parent') var obj = caller._parent;
                else if (object in juice.slot) var obj = juice.slot[object];
                else return undefined;
                if (size.includes('u')) size = size.replace(/u/, '*'+juice.gridsize+'px');
                size = parseInt(size);
                if (!property in ['width', 'height']) return undefined;
                if (operator == '=') return function() {return (obj.div.getBoundingClientRect()[property] == size)};
                if (operator == '>=') return function() {return (obj.div.getBoundingClientRect()[property] >= size)};
                if (operator == '<=') return function() {return (obj.div.getBoundingClientRect()[property] <= size)};
                if (operator == '>') return function() {return (obj.div.getBoundingClientRect()[property] > size)};
                if (operator == '<') return function() {return (obj.div.getBoundingClientRect()[property] < size)};
            }
            if (/(\w+) is (landscape|portrait|mobile|desktop)/.test(string)) return grammar_1(...string.split(' '));
            else if (/(width|height) of (\w+) (=|>=|<=|>|<) (\w+)/.test(string)) return grammar_2(...string.split(' '));
            return undefined;
        }

        check() {
            var newState = '-1';
            for (var i=this.fx.length-1; i>=0; i--) {
                if (this.fx[i]()) newState = i;
                if (this.state === undefined) this.dispatchEvent(false, i); // initally set all states to false
            }
            if (this.state === undefined && newState != '-1') this.dispatchEvent(false, i);
            //if (newState != this.state) { //TODO: only evaluate once on change => problem: multiple .ifs() will not update when properties are overwritten by another .if()
            if (this.state !== undefined) this.dispatchEvent(false, this.state);
            this.dispatchEvent(true, newState);
            this.state = newState;
            return this.state;
        }

        addEventListener(event, fx) {
            this.dispatch[event][this.active_index].push(fx);
        }

        dispatchEvent(event, id) {
            for (var i=0; i<this.dispatch[event][id].length; i++) this.dispatch[event][id][i]();
        }

        else() {
            this.active_index = '-1';
        }

        elif(string, caller) {
            var fx = this.parse(string, caller);
            if (fx === undefined) throw '.elif() condition "'+string+'" invalid.';
            this.fx.push(fx);
            this.active_index = this.fx.length-1;
            this.dispatch[true][this.active_index] = [];
            this.dispatch[false][this.active_index] = [];
        }

    }

    juice.Item = class {

        constructor() {
            this.div = document.createElement('div');
            this.div.style.cssText = 'display:flex;box-sizing:border-box;overflow:hidden;';
            this._defaults = new DefaultDict([null]);
            this.color('none');
            this._children = [];
            this._isConditional = false;
            this._conditionalMethods = this._get_conditional_methods();

            return new Proxy(this, { // TODO: replace proxy trap with decorators in next ES spec
                get: function(target, property, receiver) {
                    if (typeof target[property] === 'function' && target._conditionalMethods.includes(property)) {
                        if (target._isConditional) {
                            if (property == 'def') return new Proxy(target[property], {
                                apply(applyTarget, thisArg, args) {
                                    var node = Reflect.apply(applyTarget, thisArg, args);
                                    // TODO: Maybe replace display:none with removing/appending DOM node? (problem is inserting at the same position again...)
                                    receiver._condition.addEventListener(true, function () {node.div.style.display = 'flex';}, false);
                                    receiver._condition.addEventListener(false, function () {node.div.style.display = 'none';}, false);
                                    return node;
                                }
                            }); else return new Proxy(target[property], {
                                apply(applyTarget, thisArg, args) {
                                    receiver._condition.addEventListener(true, function () {Reflect.apply(applyTarget, thisArg, args)}, false);
                                    receiver._condition.addEventListener(false, function () {Reflect.apply(applyTarget, thisArg, target._defaults[property])}, false);
                                    return receiver;
                                }
                            });
                        } else return new Proxy(target[property], {
                            apply(applyTarget, thisArg, args) {
                                target._defaults[property] = args;
                                return Reflect.apply(applyTarget, thisArg, args);
                            }
                        });
                    }
                    return target[property];
                }
            });
        }

        _get_conditional_methods() {
            var obj = this;
            let props = []
            do {
                const l = Object.getOwnPropertyNames(obj)
                    .concat(Object.getOwnPropertySymbols(obj).map(s => s.toString()))
                    .sort()
                    .filter((p, i, arr) =>
                        typeof obj[p] === 'function' &&  //only the methods
                        p !== 'constructor' &&           //not the constructor
                        p !== 'init' &&                  //not init
                        (i == 0 || p !== arr[i - 1]) &&  //not overriding in this prototype
                        props.indexOf(p) === -1 &&       //not overridden in a child
                        !p.startsWith('_') &&            //not private
                        !/if|else|elif|fi/.test(p)       //not related to conditional mechanism
                    )
                props = props.concat(l)
            } while ((obj = Object.getPrototypeOf(obj)) && Object.getPrototypeOf(obj))
            return props
        }

        def(string) {
            if (string == '') {
                var w = new juice.Item();
            } else {
                var className = string[0].toUpperCase() + string.slice(1).toLowerCase();
                if (!component.hasOwnProperty(className)) throw 'Component class "'+className+'" was not found.';
                var w = new component[className]();
                w.init();
            }
            w.div.style.flexDirection = this.div.style.flexDirection;
            w._parent = this;
            this.div.appendChild(w.div);
            this._children.push(w);
            return w;
        }

        _isPortrait() {
            if (this.div.getBoundingClientRect().height > this.div.getBoundingClientRect().width) return true;
            else return false;
        }

        _isLandscape() {
            if (this.div.getBoundingClientRect().height < this.div.getBoundingClientRect().width) return true;
            else return false;
        }

        if(string) {
            this._defaultCSS = this.div.style.cssText;
            if (this._isConditional) throw 'Nested .if() not allowed.';
            this._condition = new Condition(string, this);
            var condition = this._condition;
            if (string.split(' ')[0] != 'device') new ResizeObserver(function() {return condition.check();}).observe(this.div);
            this._isConditional = true;
            window.addEventListener('load', (event) => {this._condition.check();}, {once: true});
            return this;
        }

        elif(string) {
            if (!this._isConditional) throw 'Using .elif() without .if()';
            this._condition.elif(string, this);
            return this;
        }

        else() {
            if (!this._isConditional) throw 'Using .else() without .if()';
            this._condition.else();
            return this;
        }

        fi() {
            if (!this._isConditional) throw 'Using .fi() without .if()';
            this._isConditional = false;
            return this;
        }

        repeat() {
            return this;
        }

        insert(item) {
            return this;
        }

        place(item) {
            return this;
        }

        clear() {
            this._children.forEach(child => {
                this.div.removeChild(child.div);
                this[child._name] = undefined;
            })
            this._children = [];
            return this;
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
                if (string.includes('u')) string = string.replace(/u/, '*'+juice.gridsize+'px');
                if (string.includes('-')) string = string.replace(/-/, ' - ');
            }
            return string;
        }

        width(string) {
            if (string === null) string = '';
            var size = this._parse_size_string(string, 'width');
            this._width = size;
            this.div.style.width = 'calc('+size+')';
            return this;
        }

        height(string) {
            if (string === null) string = '';
            var size = this._parse_size_string(string, 'height');
            this._height = size;
            this.div.style.height = 'calc('+size+')';
            return this;
        }

        flow(string) {
            if (string === null) string = 'lr';
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

        space(string) { // TODO: replace with flex gap
            if (string === null) string = '';
            if (string == 'between') this.div.style.justifyContent = 'space-between';
            else if (string == 'evenly') this.div.style.justifyContent = 'space-evenly';
            else if (string == 'around') this.div.style.justifyContent = 'space-around';
            else this.div.style.justifyContent = 'space-evenly';
            return this;
        }

        align(string) {
            if (string === null) string = '';
            if (string == 'center') this.div.style.alignItems = 'center';
            else if (string == 'left' || string == 'top') this.div.style.alignItems = 'flex-start';
            else if (string == 'right' || string == 'bottom') this.div.style.alignItems = 'flex-end';
            return this;
        }

        spacer(string) {
            var spacer = this.def()
            if (this._flow.includes('row')) spacer.width(string);
            else if (this._flow.includes('column')) spacer.height(string);
            return this;
        }

        gap(string) {
            if (string === null) string = '';
            this.div.style.gap = string;
            return this;
        }

        pad(string) {
            if (string === null) string = '';
            this.div.style.padding = string;
            return this;
        }

        padgap(string) {
            if (string === null) string = '';
            this.gap(string);
            //if (this._flow.includes('row')) this.pad('0px '+string);
            //else if (this._flow.includes('column')) this.pad(string+' 0px');
            this.pad(string);
            return this;
        }

        margin(string) {
            if (string === null) string = '';
            this.div.style.margin = string;
            return this;
        }

        on(event, signal, ...args) {
            if (typeof signal === "function") this.div.addEventListener(event, signal);
            else this.div.addEventListener(event, function(e){juice.signal[signal](e,...args)});
            return this;
        }

        slot(name) {
            juice.slot[name] = this;
            return this;
        }

        end() {
            return this._parent;
        }

        color(string) {
            if (string === undefined) string = 'none';
            var color = '';
            if (string == 'parent') {
                if (this._parent && this._parent.hasOwnProperty('_color')) color = this._parent._color || '';
                //TODO: implement event listener in case of parent color change
            } else if (juice.color.hasOwnProperty(string)) color = juice.color[string];
            else throw new Error('Got invalid color "'+string+'".');
            this.div.style.backgroundColor = color.normal;
            this.div.style.color = color.text;
            this._color = color;
            return this;
        }

        opacity(number) {
            if (string === null) this.div.style.opacity = '';
            this.div.style.opacity = number;
            return this;
        }

        hcenter(string) {
            if (string === null) this.div.style.margin = '';
            this.div.style.margin = '0 auto';
            return this;
        }

        vcenter(string) {
            if (string === null) this.div.style.margin = '';
            this.div.style.margin = 'auto 0';
            return this;
        }

        center(string) {
            if (string === null) this.div.style.margin = '';
            this.div.style.margin = 'auto';
            return this;
        }

        css(string) {
            if (string == null) this.div.style.cssText = this._defaultCSS;
            else this.div.style.cssText += string;
            return this;
        }

    }

}(window.juice = window.juice || {}));
