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
        var graph = new Graph();
        var proxy = new Proxy({}, {
            get: function(target, fx, receiver) {
                return function(...args) {
                    graph.appendNode(fx,args);
                    return proxy;
                }
            }
        });
        proxy.def(componentClass).css('width:100vw;height:100vh;flex-direction:row;');
        window.onload = function() {
            document.body.style.cssText = 'padding:0px;margin:0px;';
            graph.render();
            juice.dispatchEvent('load');
        };
        return proxy;
    };

    juice.data = function(data) {

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

        append(node) {
            if (node.fx == 'slot') {
                juice.slot[node.args[0]] = this;
                return this;
            }
            if (node.fx == 'if') node.scope.if = node;
            else node.scope.if = this.scope.if;
            if (['if','elif','else'].includes(node.fx)) node.scope.if.conditionNodes.push(node);

            if (this.fx == 'def' && !this.branch_closed) node.scope.dom = this;
            else node.scope.dom = this.scope.dom;

            if (['end','elif','else'].includes(node.fx)) {
                this.scope.graph.branch_closed = true;
                if (node.fx == 'end') return this.scope.graph;
                else {
                    this.scope.graph.after = node;
                    node.scope.graph = this.scope.graph;
                    return node;
                }
            }

            if (['def','if','elif','else'].includes(this.fx) && !this.branch_closed) {
                node.scope.graph = this;
                this.branch = node;
            } else {
                node.scope.graph = this.scope.graph;
                this.after = node;
            }
            return node;
        }

        dispatchEvent(event) {
            for (var fx of this.events[event]) fx();
            for (var fx of this.events['any']) fx();
        }

        addEventListener(event, fx) {
            if (!this.events[event].includes(fx)) this.events[event].push(fx);
        }

        render() {
            if (this.scope.dom != undefined && !this.scope.dom.rendered) this.scope.dom.render();
            if (this.rendered) return;
            this.rendered = true;
            if (this.fx == 'def') this.addNewItem();
            else if (this.fx == 'if') {
                for (var node of this.conditionNodes) this.installCondition(node);
                this.checkConditions();
            } else if (this.fx == 'repeat') {

            } else if (this.fx == 'map') {

            } else if (this.fx == 'insert') {

            } else if (this.fx == 'map') {

            } else if (!['else','elif'].includes(this.fx)) {
                this.scope.dom.rendered_item[this.fx](...this.args);
            }
            if (this.after !== undefined) this.after.render();
            //else {console.log('renderend');this.dispatchEvent('renderEnd');}
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
                    if (node.after !== undefined) propagate(node.after);
                    if (node.branch !== undefined) propagate(node.branch);
                }
                propagate(this);
            } else this.scope.dom.unrender();
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
                triggerNode.addEventListener('any',this.checkConditions.bind(this));
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
        constructor() {
            this.root = undefined;
            this.tip = undefined;
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
                if (string.includes('u')) string = string.replace(/u/, '*'+juice.gridsize+'px');
                if (string.includes('-')) string = string.replace(/-/, ' - ');
                string += ' + 0.5px'; // hack to avoid shaking on css transition as per https://stackoverflow.com/questions/53094304/inner-div-oscillates-when-using-a-css-transition-on-the-parent-div
            }
            return string;
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
            this.div.style.gap = string;
            return this;
        }

        pad(string) {
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

        end() {
            return this._parent;
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

        css(string) {
            this.div.style.cssText += string;
            return this;
        }

    }

}(window.juice = window.juice || {}));
