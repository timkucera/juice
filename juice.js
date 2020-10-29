(function(juice, undefined) {

    juice.color = _COLOR.dull;
    juice.gridsize = 30;

    juice.signal = {};
    juice.slot = {};

    class View {
        constructor() {

        }

        get height() {
            return document.documentElement.clientHeight;
        }

        get width() {
            return document.documentElement.clientWidth;
        }

        isPortrait() {
            if (this.height > this.width) return true;
            else return false;
        }

        isLandscape() {
            if (this.height < this.width) return true;
            else return false;
        }

        isMobile() {
            //TODO: implement
            console.log('Warning: Not implemented yet.')
            return false;
        }
    }

    juice.def = function() {
        var w = new juice.Item();
        w.div.style.flexDirection = 'column';
        w._parent = document.body;
        window.onload = function() {document.body.appendChild(w.div)};
        return w;
    };

    juice.Item = class {

        constructor() {
            this.div = document.createElement('div');
            this.div.style.cssText = 'display:flex;box-sizing:border-box;overflow:hidden;';
            this.flow('lr');
            this._children = [];
            this.color('none');
        }

        def(string) {
            if (string == '') {
                var w = new juice.Item();
            } else {
                var className = string[0].toUpperCase() + string.slice(1).toLowerCase();
                if (!component.hasOwnProperty(className)) console.log('Error: Component class "'+className+'" was not found.');
                var w = new component[className]();
                w.init();
            }
            w.div.style.flexDirection = this.div.style.flexDirection;
            w._parent = this;
            this.div.appendChild(w.div);
            this._children.push(w);
            return w;
        }

        insert(item) {
            this._layout._inserts.push([item, this]);
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
                console.log('Warning: Not implemented yet.')
                string = '';
                //if (query == 'height') string = this._width;
                //else if (query == 'width') string = this._height;
            } else {
                if (string[0] == '-') string = '100%'+string;
                if (string[0] == '/') string = '100%'+string; // ?
                var gridsize = (this._layout == undefined) ? 30 : this._layout._gridsize;
                if (string.includes('u')) string = string.replace(/u/, '*'+gridsize+'px');
                if (string.includes('-')) string = string.replace(/-/, ' - ');
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
            var spacer = this.define('_spacer')
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
            } else if (string == 'none') {
                color = '';
            } else if (juice.color.hasOwnProperty(string)) color = juice.color[string];
            else console.log('Error: Invalid color given. Got "'+string+'".');
            this.div.style.backgroundColor = color.normal;
            this.div.style.color = color.text;
            this._color = color;
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
