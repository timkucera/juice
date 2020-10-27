(function(juice, undefined) {

    juice.color = _COLOR.dull;

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

    juice.UI = class UI {
        constructor() {
            this._media = {};
            this._layouts = {};
            this._view = new View();
            return new Proxy(this, {
                get: function(target, name, receiver) {
                    if ( !['media','build','layout'].includes(name) && !(name[0] == '_') ) {
                        return target._layout[name];
                    } else return target[name]
                }
            });
        }

        media(expression, name) {
            //TODO: check for duplicate names
            this._media[name] = expression;
            return this;
        }

        _check_media_expressions() {
            for (var name in this._media) if (this._media[name](this._view)) return name;
            return false;
        }

        build(parent) {
            if (!parent) {
                parent = document.body;
            }
            parent.style.cssText += "font-family: 'Baloo Chettan 2', cursive;margin:0;padding:0;";
            var media_name = this._check_media_expressions();
            if (!media_name) console.log('Warning: Please provide a default media configuration.');
            if (!this._layouts.hasOwnProperty(media_name)) console.log('Error: Media defintion "'+media_name+'" was not found.');
            var layout = this._layouts[media_name];
            this._layout = layout;
            parent.appendChild(layout.div)
        }

        /*
        render() {

        }
        */

        layout(name) {
            var layout = new juice.Layout(this);
            this._layouts[name] = layout;
            return layout;
        }

    }

    class DivBasedElement {
        constructor() {
            this.div = document.createElement('div');
            this.div.style.cssText = 'display:flex;box-sizing:border-box;overflow:hidden;';
            this.flow('lr');
        }
        define(name) {
            //TODO: check name validity (no built-in method, no underscore)
            var w = new juice.Widget();
            w.div.style.flexDirection = this.div.style.flexDirection;
            w.div.id = name;
            w._name = name;
            w._parent = this;
            w._ui = this._ui;
            w._layout = this._layout;
            this.div.appendChild(w.div);
            this[name] = w;
            return w;
        }

        _parse_size_string(string, query) {
            if (string == 'fill') {
                if (this._parent._flow.includes('column') && query == 'height') {
                    this.div.style.flex = '1';
                    string = '';
                } else if (this._parent._flow.includes('row') && query == 'width') {
                    this.div.style.flex = '1';
                    string = '';
                } else string = '100%';
            } else if (string == 'square') {
                console.log('Warning: Not implemented yet.')
                string = '';
                //if (query == 'height') string = this._width;
                //else if (query == 'width') string = this._height;
            } else {
                if (string[0] == '-') string = '100%'+string;
                if (string[0] == '/') string = '100%'+string; // ?
                if (string.includes('u')) string = string.replace(/u/, '*'+this._layout._gridsize+'px');
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
    }

    juice.Layout = class Layout extends DivBasedElement {
        constructor(ui) {
            super();
            this.div.style.cssText += 'width:100%;height:100%;';
            this._ui = ui;
            this._layout = this;
            this._gridsize = 30;
        }

        gridsize(gridsize) {
            this._gridsize = gridsize;
            return this;
        }

    }

    juice.Widget = class Widget extends DivBasedElement {

        constructor() {
            super();
            this.color('none');
        }

        init() {}

        parent() {
            return this._parent;
        }

        color(string) {
            var color = '';
            if (string == 'parent') {
                color = this._parent._color || '';
                //TODO: implement event listener in case of parent color change
            } else if (string == 'none') {
                color = '';
            } else if (juice.color.hasOwnProperty(string)) color = juice.color[string];
            else console.log('Error: Invalid color given. Got "'+string+'".');
            this.div.style.backgroundColor = color.normal;
            this._color = color;
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

        type(string) {
            var className = string[0].toUpperCase() + string.slice(1).toLowerCase();
            if (!component.hasOwnProperty(className)) console.log('Error: Component class "'+className+'" was not found.');
            var newObject = new component[className]();
            Object.assign(newObject, this);
            newObject.init();
            this._parent.div.removeChild(this.div);
            this._parent.div.appendChild(newObject.div);
            this._parent[this._name] = newObject;
            return newObject;
        }
    }

}(window.juice = window.juice || {}));
