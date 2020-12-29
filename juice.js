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
                    juice.graph.tip.errorstack = new Error().stack;
                    return proxy;
                }
            }
        });
        proxy.def(componentClass).css('width:100vw;height:100vh;flex-direction:row;');
        window.onload = function() {
            var t0 = performance.now();
            document.body.style.cssText = 'padding:0px;margin:0px;';
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

    juice.data = function(data) {
        if (Object.prototype.toString.call(data) !== "[object Object]") data = Object(data);
        data.$events = new DefaultDict([]);
        data.$dispatchEvent = function(event) {
            for (var [node,fx] of this.$events[event]) node[fx]();
            for (var [node,fx] of this.$events['any']) node[fx]();
        }
        data.$addEventListener = function(event,node,fx) {
            if (!this.$events[event].some(([n,f]) => n == node && f == fx)) this.$events[event].push([node,fx]);
        }
        var proxy =  new Proxy(data, {
            set: function(obj, prop, value) {
                if (!prop.startsWith('$') && Array.isArray(value)) data[prop] = new Proxy(data[prop], {
                    apply: function(target, thisArg, argumentsList) {
                        data.$dispatchEvent('change');
                        return thisArg[target].apply(this, argumentList);
                    },
                    deleteProperty: function(target, property) {
                        delete target[property];
                        data.$dispatchEvent('change');
                        return true;
                    },
                    set: function(target, property, value, receiver) {
                        if (Object.prototype.toString.call(value) !== "[object Object]") value = Object(value);
                        var oldValue = target[property];
                        target[property] = value;
                        if (oldValue != value) data.$dispatchEvent('change');
                        return true;
                    }
                });
                if (Object.prototype.toString.call(value) !== "[object Object]") value = Object(value);
                obj[prop] = value;
                obj.$dispatchEvent('change');
                return true;
            },
            get: function (target, prop, receiver) {
                if (prop == '$length') return Math.max(...Object.entries(target).map(([k,v]) => Array.isArray(v) ? v.length : 1));
                else if (Object.getOwnPropertyNames(target).includes(prop)) {
                    var obj = Object(target[prop]);
                    obj.$data = target;
                    obj.$key = prop;
                    return obj;
                } else return target[prop];
            },
        });
        for (const [key, value] of Object.entries(data)) proxy[key] = data[key];
        proxy.$data = data;
        return proxy;
    };

    var DEVICE = juice.data({
        width: undefined,
        height: undefined,
        isMobile: undefined,
        isDesktop: undefined,
        check: ()=>{
            DEVICE.width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
            DEVICE.height = window.innerHeight|| document.documentElement.clientHeight || document.body.clientHeight;
            DEVICE.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            DEVICE.isDesktop = !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        }
    });
    window.addEventListener('resize', DEVICE.check);
    DEVICE.check();

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
                    for (var [node,fx] of this.events[event]) node[fx]();
                    for (var [node,fx] of this.events['any']) node[fx]();
                }
                this.dispatch_batch = new Set();
                this.dispatch_timer = undefined;
            }, 20);
            this.dispatch_batch.add(event);
        }

        addEventListener(event,node,fx) {
            if (!this.events[event].some(([n,f]) => n == node && f == fx)) this.events[event].push([node,fx]);
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
                        if (!!datapiece && datapiece.$data === data.$data) {
                            if (datapiece.$key) datapiece = datapiece.$data[datapiece.$key];
                            if (Array.isArray(datapiece)) return [fx,[datapiece[i]]];
                            else if (datapiece && {}.toString.call(datapiece) === '[object Function]') return [fx,[datapiece(i)]];
                            else return [fx,[datapiece]];
                        } else return [fx,args];
                    });
                    var node = this.fromChain(chain);
                    node.scope.dom = this.scope.dom;
                    node.render();
                }
                if (data.$data) data.$addEventListener('change',this,'rerender');
            } else if (this.fx == 'repeat') {
                var arg = this.args[0];
                if (arg.$data && arg.$key) var repeats = arg.$data[arg.$key];
                else var repeats = arg;
                for (var i=0; i<repeats; i++) {
                    var node = this.branch.clone();
                    node.scope.dom = this.scope.dom;
                    node.render();
                }
                if (arg.$data) arg.$data.$addEventListener('change',this,'rerender');
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
                if (!this.fx in this.scope.dom.rendered_item) throw 'Function '+this.fx+' not found. '+this.errorstack;
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
                item.div.setAttribute('name','');
            } else {
                var className = this.args[0][0].toUpperCase() + this.args[0].slice(1).toLowerCase();
                if (!component.hasOwnProperty(className)) throw 'Component class "'+className+'" was not found.';
                var item = new component[className]();
                item.node = this;
                item.data = this.data;
                item.div.setAttribute('name',className);
                item.init();
            }
            var self = this;
            item.resizeObserver = new ResizeObserver(()=>{self.dispatchEvent('resize');});
            this.addEventListener('resize',this,'updateDimensions')
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
                    target.$addEventListener('change',target_node,'checkConditions');
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
                        if (typeof term === 'string') term = parse_object(term);
                    }
                    if (term != '') terms.push(term);
                    for (var t=0;t<terms.length;t++) if (typeof term === 'string' && !Object.keys(logic).includes(terms[t])) terms[t] = split(terms[t]);
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

$template = juice.$template;
