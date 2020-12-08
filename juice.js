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
        };
        return proxy;
    };

    juice.data = function(data) {

    };

    class Node {
        constructor(fx, args) {
            this.fx = fx;
            this.args = args;
            this.parent = undefined;
            this.after = undefined;
            this.branch = undefined;
            this.branch_closed = false;
            this.rendered_item = undefined;
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
                if (this.parent === undefined) document.body.appendChild(item.div);
                else {
                    this.parent.rendered_item.div.appendChild(item.div);
                    this.parent.rendered_item._children.push(item);
                    item._parent = this.parent.rendered_item;
                    item.div.style.flexDirection = this.parent.rendered_item.div.style.flexDirection;
                }
                if (this.branch !== undefined) this.branch.render();
            } else if (this.fx == 'if') {

            } else if (this.fx == 'map') {

            } else if (this.fx == 'repeat') {

            } else if (this.fx == 'map') {

            } else if (this.fx == 'map') {

            } else {
                this.parent.rendered_item[this.fx](...this.args);
            }
            if (this.after !== undefined) this.after.render();
        }

        append(node) {
            if (node.fx == 'end') {
                this.parent.branch_closed = true;
                return this.parent;
            }
            if (this.fx == 'def' && !this.branch_closed) {
                node.parent = this;
                this.branch = node;
            } else {
                node.parent = this.parent;
                this.after = node;
            }
            return node;
        }
    }

    class Graph {
        constructor() {
            this.root = undefined;
            this.tip = undefined;
            this.id = 1;
        }

        render(node) {
            if (node === undefined) node = this.root;
            node.render();
        }

        appendNode(fx,args) {
            var node = new Node(fx,args);
            node.id = this.id;
            this.id++;
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
            this.__color = string;
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
