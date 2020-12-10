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

    juice.eventListeners = {'load': []};
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
            this.rendered_item = undefined;
            this.conditions = [];
        }

        render() {
            if (this.fx == 'def') {
                if (this.args[0] === undefined) var item = new juice.Item();
                else {
                    var className = this.args[0][0].toUpperCase() + this.args[0].slice(1).toLowerCase();
                    if (!component.hasOwnProperty(className)) throw 'Component class "'+className+'" was not found.';
                    var item = new component[className]();
                    item.init();
                }
                this.rendered_item = item;
                if (this.scope.dom === undefined) document.body.appendChild(item.div);
                else {
                    this.scope.dom.rendered_item.div.appendChild(item.div);
                    this.scope.dom.rendered_item._children.push(item);
                    item._parent = this.scope.dom.rendered_item;
                    item.div.style.flexDirection = this.scope.dom.rendered_item.div.style.flexDirection;
                }
                if (this.branch !== undefined) this.branch.render();
            } else if (this.fx == 'if') {
                var else_condition = undefined;
                var true_condition = undefined;
                for (var c of this.conditions) {
                    if (c.node.fx == 'else') else_condition = c.node.branch;
                    else if (c.condition()) {
                        true_condition = c.node.branch;
                        break;
                    }
                }
                if (true_condition != undefined) true_condition.render();
                else if (else_condition != undefined) else_condition.render();
            } else if (this.fx == 'map') {

            } else if (this.fx == 'repeat') {

            } else if (this.fx == 'map') {

            } else if (this.fx == 'map') {

            } else {
                this.scope.dom.rendered_item[this.fx](...this.args);
            }
            if (this.after !== undefined) this.after.render();
        }

        append(node) {
            if (node.fx == 'if') node.scope.if = node;
            else node.scope.if = this.scope.if;
            if (['if','elif','else'].includes(node.fx)) node.scope.if.conditions.push({
                condition: this.parseCondition(node),
                node: node,
            });

            if (this.fx == 'def' && !this.branch_closed) node.scope.dom = this;
            else node.scope.dom = this.scope.dom;

            if (['end','elif','else'].includes(node.fx)) {
                this.scope.graph.branch_closed = true;
                if (node.fx == 'end') return this.scope.graph;
                else {
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

        parseCondition(targetNode, string) {
            var string = targetNode.args[0];
            function grammar_1(object, is, orientation) {
                var caller = () => {return targetNode.scope.if.scope.dom.rendered_item};
                if (object == 'this') var obj = () => {return caller()};
                else if (object == 'parent') var obj = () => {return caller()._parent};
                else if (object == 'device') var obj = () => {return juice.device};
                else if (object in juice.slot) var obj = () => {return juice.slot[object]};
                else return undefined;
                if (orientation == 'landscape') return function() {return obj()._isLandscape();}
                else if (orientation == 'portrait') return function() {return obj()._isPortrait();}
                else if (orientation == 'mobile' && object == 'device') return function() {return obj().isMobile();}
                else if (orientation == 'desktop' && object == 'device') return function() {return obj().isDesktop();}
                else return undefined;
            }

            function grammar_2(property, of, object, operator, size) {
                var caller = () => {return targetNode.scope.if.scope.dom.rendered_item.div};
                if (object == 'this') var obj = () => {return caller()};
                else if (object == 'parent') var obj = () => {return caller()._parent};
                else if (object in juice.slot) var obj = () => {return juice.slot[object]};
                else return undefined;
                if (size.includes('u')) size = size.replace(/u/, '*'+juice.gridsize+'px');
                size = parseInt(size);
                if (!property in ['width', 'height']) return undefined;
                if (operator == '=') return function() {return (obj().div.getBoundingClientRect()[property] == size)};
                if (operator == '>=') return function() {return (obj().div.getBoundingClientRect()[property] >= size)};
                if (operator == '<=') return function() {return (obj().div.getBoundingClientRect()[property] <= size)};
                if (operator == '>') return function() {return (obj().div.getBoundingClientRect()[property] > size)};
                if (operator == '<') return function() {return (obj().div.getBoundingClientRect()[property] < size)};
            }
            if (/(\w+) is (landscape|portrait|mobile|desktop)/.test(string)) return grammar_1(...string.split(' '));
            else if (/(width|height) of (\w+) (=|>=|<=|>|<) (\w+)/.test(string)) return grammar_2(...string.split(' '));
            return undefined;
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
            this._children = [];
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

        slot(name) {
            juice.slot[name] = this;
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
