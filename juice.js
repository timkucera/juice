(function(juice, undefined) {

    juice.color = _COLOR.dull;
    juice.gridsize = 30;

    juice.signal = {};
    juice.slot = {};

    juice.theme = {
        style: 'flat',
    };

    var DEVICE = {
        isMobile: function() {return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)},
        isDesktop: function() {return !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)},
    };

    class DefaultDict {
        constructor(defaultVal) {
            return new Proxy({}, {
                get: (target, name) => name in target ? target[name] : defaultVal
            })
        }
    }

    juice.eventListeners = new DefaultDict([]);
    juice.addEventListener = function(event, fx) {
        juice.eventListeners[event].push(fx);
    }
    juice.dispatchEvent = function(event) {
        for (var fx of juice.eventListeners[event]) fx();
    }

    juice.def = function(componentClass) {
        juice.graph = new Graph();
        var proxy = new Proxy({}, {
            get: function(target, fx, receiver) {
                return function(...args) {
                    juice.graph.appendNode(fx,args);
                    return proxy;
                }
            }
        });
        proxy.def(componentClass).css('width:100vw;height:100vh;flex-direction:row;');
        window.onload = function() {
            document.body.style.cssText = 'padding:0px;margin:0px;';
            juice.graph.render();
            juice.dispatchEvent('load');
        };
        return proxy;
    };

    juice.data = function(data) {
        data = Object(data);
        data._events = new DefaultDict([]);
        data.dispatchEvent = function(event) {
            for (var [node,fx] of this._events[event]) node[fx]();
            for (var [node,fx] of this._events['any']) node[fx]();
        }
        data.addEventListener = function(event,node,fx) {
            if (!this._events[event].some(([n,f]) => n == node && f == fx)) this._events[event].push([node,fx]);
        }
        for (const [key, value] of Object.entries(data)) {
            if (!['addEventListener','dispatchEvent','_events'].includes(key) && Array.isArray(value)) data[key] = new Proxy(data[key], {
                apply: function(target, thisArg, argumentsList) {
                    data.dispatchEvent('change');
                    return thisArg[target].apply(this, argumentList);
                },
                deleteProperty: function(target, property) {
                    data.dispatchEvent('change');
                    return true;
                },
                set: function(target, property, value, receiver) {
                    target[property] = value;
                    data.dispatchEvent('change');
                    return true;
                }
            });
        }
        var proxy =  new Proxy(data, {
            set: function(obj, prop, value) {
                if (!['addEventListener','dispatchEvent','_events'].includes(prop) && Array.isArray(value)) data[prop] = new Proxy(data[prop], {
                    apply: function(target, thisArg, argumentsList) {
                        data.dispatchEvent('change');
                        return thisArg[target].apply(this, argumentList);
                    },
                    deleteProperty: function(target, property) {
                        data.dispatchEvent('change');
                        return true;
                    },
                    set: function(target, property, value, receiver) {
                        target[property] = value;
                        data.dispatchEvent('change');
                        return true;
                    }
                });
                obj[prop] = value;
                obj.dispatchEvent('change');
            },
            get: function (target, prop, receiver) {
                if (prop == '_length') return Math.max(...Object.entries(target).map(([k,v]) => Array.isArray(v) ? v.length : 1));
                else return target[prop];
            },
        });
        return proxy;
    };

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
            this.events = new DefaultDict([]);
        }

        dispatchEvent(event) {
            for (var [node,fx] of this.events[event]) node[fx]();
            for (var [node,fx] of this.events['any']) node[fx]();
        }

        addEventListener(event,node,fx) {
            if (!this.events[event].some(([n,f]) => n == node && f == fx)) this.events[event].push([node,fx]);
        }

        append(node) {
            if (node.fx == 'slot') juice.slot[node.args[0]] = this;

            if (this.fx == 'def' && !this.branch_closed) node.scope.dom = this;
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

            if (['def','if','elif','else','map'].includes(this.fx) && !this.branch_closed) {
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
                for (var i=0; i<data._length; i++) {
                    var chain = this.branch.ravel().map(([fx,args]) => {
                        var datapiece = args[0];
                        if (Object.keys(data).some(k => data[k] === datapiece)) {
                            if (Array.isArray(datapiece)) return [fx,[datapiece[i]]];
                            else if (datapiece && {}.toString.call(datapiece) === '[object Function]') return [fx,[datapiece(i)]];
                            else return [fx,[datapiece]];
                        }
                        else return [fx,args];
                    });
                    var node = this.fromChain(chain);
                    node.scope.dom = this.scope.dom;
                    node.render();
                }
                data.addEventListener('change',this,'rerender');

            } else if (this.fx == 'repeat') {

            } else if (this.fx == 'insert') {

            } else if (['end','else','elif','slot'].includes(this.fx)) {
                // do  nothing
            } else {
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
            this.render()
        }

        addNewItem() {
            if (this.args[0] === undefined) var item = new juice.Item();
            else {
                var className = this.args[0][0].toUpperCase() + this.args[0].slice(1).toLowerCase();
                if (!component.hasOwnProperty(className)) throw 'Component class "'+className+'" was not found.';
                var item = new component[className]();
                item.init();
            }
            var self = this;
            item.resizeObserver = new ResizeObserver(()=>{self.dispatchEvent('resize');});
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
            var string = conditionalNode.args[0];
            if (string !== undefined) {
                if (/(\w+) is (landscape|portrait|mobile|desktop)/.test(string)) {
                    var [object, is, orientation] = string.split(' ');
                    if (orientation == 'landscape') var evaluation = function(node) {return node.rendered_item._isLandscape();}
                    else if (orientation == 'portrait') var evaluation = function(node) {return node.rendered_item._isPortrait();}
                    else if (orientation == 'mobile' && object == 'device') var evaluation = function(node) {return node.rendered_item.isMobile();}
                    else if (orientation == 'desktop' && object == 'device') var evaluation = function(node) {return node.rendered_item.isDesktop();}
                } else if (/(width|height) of (\w+) (=|>=|<=|>|<) (\w+)/.test(string)) {
                    var [property, of, object, operator, size] = string.split(' ');
                    if (size.includes('u')) size = size.replace(/u/, '*'+juice.gridsize+'px');
                    size = parseInt(size);
                    if (operator == '=') var evaluation = function(node) {return (node.rendered_item.div.getBoundingClientRect()[property] == size)};
                    if (operator == '>=') var evaluation = function(node) {return (node.rendered_item.div.getBoundingClientRect()[property] >= size)};
                    if (operator == '<=') var evaluation = function(node) {return (node.rendered_item.div.getBoundingClientRect()[property] <= size)};
                    if (operator == '>') var evaluation = function(node) {return (node.rendered_item.div.getBoundingClientRect()[property] > size)};
                    if (operator == '<') var evaluation = function(node) {return (node.rendered_item.div.getBoundingClientRect()[property] < size)};
                }
                if (object == 'this') var triggerNode = conditionalNode.scope.dom;
                else if (object == 'parent') var triggerNode = conditionalNode.scope.dom.scope.dom;
                else if (object == 'device') var triggerNode = DEVICE;
                else if (object in juice.slot) var triggerNode = juice.slot[object];
                var fx = function() {return evaluation(triggerNode);}
                triggerNode.addEventListener('any',this,'checkConditions');
            } else var fx = undefined;
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
            this.color('none');
        }

        _isPortrait() {
            if (this.div.getBoundingClientRect().height > this.div.getBoundingClientRect().width) return true;
            else return false;
        }

        _isLandscape() {
            if (this.div.getBoundingClientRect().height < this.div.getBoundingClientRect().width) return true;
            else return false;
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
                if (string.includes('u')) string = string.replace(/u/, ' * '+juice.gridsize+'px');
                if (string.includes('-')) string = string.replace(/-/, ' - ');
                string += ' + 0.5px'; // hack to avoid shaking on css transition as per https://stackoverflow.com/questions/53094304/inner-div-oscillates-when-using-a-css-transition-on-the-parent-div
            }
            return string;
        }

        _parse_font_size = function(string) {
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

        space(string) { // TODO: replace with flex gap
            if (string == 'between') this.div.style.justifyContent = 'space-between';
            else if (string == 'evenly') this.div.style.justifyContent = 'space-evenly';
            else if (string == 'around') this.div.style.justifyContent = 'space-around';
            else this.div.style.justifyContent = 'space-evenly';
            return this;
        }

        align(string) {
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
            if (string.includes('u')) string = 'calc('+string.replace(/u/, ' * '+juice.gridsize+'px')+')';
            this.div.style.gap = string;
            return this;
        }

        pad(string) {
            if (string.includes('u')) string = 'calc('+string.replace(/u/, ' * '+juice.gridsize+'px')+')';
            this.div.style.padding = string;
            return this;
        }

        padgap(string) {
            this.gap(string);
            //if (this._flow.includes('row')) this.pad('0px '+string);
            //else if (this._flow.includes('column')) this.pad(string+' 0px');
            this.pad(string);
            return this;
        }

        margin(string) {
            this.div.style.margin = string;
            return this;
        }

        on(event, signal, ...args) {
            if (typeof signal === "function") this.div.addEventListener(event, signal);
            else this.div.addEventListener(event, function(e){juice.signal[signal](e,...args)});
            return this;
        }

        color(string) {
            var color = '';
            if (string == 'parent') {
                if (this._parent && this._parent.hasOwnProperty('_color')) color = this._parent._color || '';
                //TODO: implement event listener in case of parent color change
            } else if (juice.color.hasOwnProperty(string)) color = juice.color[string];
            else throw new Error('Got invalid color "'+string+'".');
            this.div.style.backgroundColor = color.normal;
            this.div.style.color = color.text;
            this._color = color;
            this.__color = string;
            return this;
        }

        opacity(number) {
            this.div.style.opacity = number;
            return this;
        }

        hcenter() {
            this.div.style.margin = '0 auto';
            return this;
        }

        vcenter() {
            this.div.style.margin = 'auto 0';
            return this;
        }

        center() {
            this.div.style.margin = 'auto';
            return this;
        }

        wrap() {
            this.div.style.flexWrap = 'wrap';
            return this;
        }

        css(string) {
            this.div.style.cssText += string;
            return this;
        }

    }

}(window.juice = window.juice || {}));
