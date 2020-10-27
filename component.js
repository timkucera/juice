(function(component, undefined) {

    function applyStyle(style, elem) {
        var styles = style.split(' ');
        if (styles.length == 1) {
            if (style == 'flat') elem.div.style.cssText += 'border:none;';
            else if (style == 'border') elem.div.style.cssText += 'border:2px solid '+elem._color.dark+';';
            else if (style == 'round') elem.div.style.cssText += 'border-radius:calc('+elem._height+'/2);'; // TODO: smallest side / 2
            else if (style == 'rounded') elem.div.style.cssText += 'border-radius:10px;';
            else if (style == 'rect') elem.div.style.cssText += 'border-radius:2px;';
            else if (style == 'shadow') elem.div.style.cssText += 'box-shadow:0px 0px 3px '+elem._color.dark+';';
            else if (style == 'none') elem.div.style.cssText += 'border:none;background-color:none;';
        } else styles.forEach(item => applyStyle(item, elem));
    }

    component.Button = class Button extends juice.Widget {

        init() {
            //TODO: change to dynamic gridsize and color
            this.div.style.cssText += 'justify-content:center;align-items:center;cursor:pointer;color:'+this._color.text+';background-color:'+this._color.normal+';user-select:none;outline:0;-webkit-user-select: none;';
            this.style('border rect');
        }

        text(text) {
            this.div.innerHTML = text;
            return this;
        }

        bold() {
            this.div.style.fontWeight = 'bold';
            return this;
        }

        image(path) {
            this.div.style.content = 'url('+path+')';
            return this;
        }

        style(style) {
            applyStyle(style, this);
            return this;
        }
    }

    component.Image = class Image extends juice.Widget {

        init() {
            this.div.style.cssText += 'color:'+this._color.dark+';background-color:'+this._color.light+';';
            this.style('border rect');
        }

        source(path) {
            this.div.style.content = 'url('+path+')';
            return this;
        }

        style(style) {
            applyStyle(style, this);
            return this;
        }
    }

    component.Shape = class Shape extends juice.Widget {

        init() {
            this.div.style.cssText += 'color:'+this._color.dark+';background-color:'+this._color.normal+';';
            this.style('border rect');
        }

        shape(string) {
            // TDOD: implement
            return this;
        }

        style(style) {
            applyStyle(style, this);
            return this;
        }
    }

    component.Text = class Text extends juice.Widget {

        init() {
            this.div.style.cssText += 'color:'+this._color.dark+';background-color:'+this._color.normal+';';
            this.style('border rect');
        }

        text(text) {
            this.div.innerHTML = text;
            return this;
        }

        fontsize(string) {
            this.div.style.cssText += 'font-size:'+string;
            return this;
        }

        bold() {
            this.div.style.cssText += 'font-weight:900;';
            return this;
        }

        italic() {
            this.div.style.cssText += 'font-style:italic;';
            return this;
        }

        underline() {
            this.div.style.cssText += 'text-decoration:underline;';
            return this;
        }

        style(style) {
            applyStyle(style, this);
            return this;
        }
    }

    component.Progress = class Progress extends juice.Widget {

        init() {
            this.div.style.cssText += 'background-color:'+this._color.dark+';display:flex;overflow:hidden;';
            this._progress = document.createElement('div');
            this._progress.style.cssText = 'height:100%;background-color:'+this._color.light+';';
            this.div.appendChild(this._progress);
            this._direction = 'horizontal';
            this.style('flat');
        }

        default(value) {
            this.value = value;
            this._default = value;
            return this;
        }

        vertical() {
            this._direction = 'vertical';
            this._progress.style.cssText += 'width:100%;';
            this.div.style.cssText += 'flex-direction:column-reverse;';
            this.value = this._value;
            return this;
        }

        set value(value) {
            // TODO: float values (0-1)
            if (!isNaN(value)) value = value+'%';
            else if (typeof value === 'string' && !value.includes('%')) value = value+'%';
            if (this._direction == 'horizontal') this._progress.style.width = value;
            else if (this._direction == 'vertical') this._progress.style.height = value;
            this._value = value;
        }

        get value() {
            return this._value;
        }

        style(style) {
            applyStyle(style, this);
            return this;
        }
    }

    component.Slider = class Slider extends juice.Widget {

        init() {
            this._slider = document.createElement('input');
            this._slider.type = 'range';
            this._slider.style.cssText = 'width:100%;height:5px;outline:none;background-color:'+this._color.dark+';';
            this._slider.classList.add('juiceSlider');
            this._slider.style.setProperty('--handle-color', this._color.light);
            this._slider.style.setProperty('--handle-border-color', this._color.dark);
            this.div.appendChild(this._slider);
            this.min(1);
            this.max(100);
        }

        min(value) {
            this._slider.min = value;
            return this;
        }

        max(value) {
            this._slider.max = value;
            return this;
        }

        default(value) {
            this._slider.value = value;
            return this;
        }

        style(style) {
            function applySliderStyle(style,elem) {
                var styles = style.split(' ');
                if (styles.length == 1) {
                    if (style == 'flat') elem._slider.style.setProperty('--handle-border-width', '0px');
                    else if (style == 'border') elem._slider.style.setProperty('--handle-border-width', '2px');
                    else if (style == 'round') {
                        elem._slider.style.setProperty('--handle-border-radius', 'calc(var(--handle-height)/2)');
                        elem.div.style.cssText += 'border-radius:calc('+elem._height+'/2);';
                    }
                    else if (style == 'rounded') elem._slider.style.setProperty('--handle-border-radius', '5px');
                    else if (style == 'rect') {
                        elem._slider.style.setProperty('--handle-border-radius', '2px');
                        elem.div.style.cssText += 'border-radius:0px;';
                    }
                    else if (style == 'shadow') elem._slider.style.setProperty('--handle-shadow', '0px 0px 3px '+elem._color.dark);
                    else if (style == 'none') {
                        elem._slider.style.setProperty('--handle-border-radius', '0px');
                        elem._slider.style.setProperty('--handle-border-width', '0px');
                        elem._slider.style.setProperty('--handle-shadow', '0px');
                    }
                } else styles.forEach(item => applySliderStyle(item,elem));
            }
            applySliderStyle(style,this);
            return this;
        }
    }
}(window.component = window.component || {}));
