(function(component, undefined) {

    function applyStyle(style, elem) {
        var styles = style.split(' ');
        if (styles.length == 1) {
            if (style == 'flat') elem.div.style.cssText += 'border:none;';
            else if (style == 'border') elem.div.style.cssText += 'border:2px solid '+elem._color.dark+';';
            else if (style == 'round') elem.div.style.cssText += 'border-radius:calc('+elem._height+'/2);'; // TODO: smallest side / 2
            else if (style == 'rounded') elem.div.style.cssText += 'border-radius:10px;';
            else if (style == 'rect') elem.div.style.cssText += 'border-radius:2px;';
            else if (style == 'sharp') elem.div.style.cssText += 'border-radius:0px;';
            else if (style == 'shadow') elem.div.style.cssText += 'box-shadow:0px 0px 3px '+elem._color.dark+';';
            else if (style == 'none') elem.div.style.cssText += 'border:none;background-color:none;';
        } else styles.forEach(item => applyStyle(item, elem));
    }

    component.Button = class Button extends juice.Item {

        init() {
            //TODO: change to dynamic gridsize and color
            this.div.style.cssText += 'justify-content:center;align-items:center;cursor:pointer;color:'+this._color.text+';background-color:'+this._color.normal+';user-select:none;outline:0;-webkit-user-select: none;';
            this.style('border rect');
            this.div.onmouseover = function() {this.style.filter = 'brightness(90%)'}
            this.div.onmouseleave = function() {this.style.filter = 'none'}
        }

        text(text) {
            this.div.style.padding = '5px 10px 5px 10px';
            this.div.innerHTML = text;
            return this;
        }

        bold() {
            this.div.style.fontWeight = 'bold';
            return this;
        }

        image(path) {
            this.div.style.padding = '3px';
            if (path.split('.').pop() == 'svg') {
                if (this.div.svg) this.div.removeChild(this.div.svg);
                var svg = document.createElement('div');
                svg.style = 'width:100%;height:100%;background-color:'+this._color.light+';-webkit-mask-image:url('+path+');-webkit-mask-size: contain;-webkit-mask-repeat: no-repeat;-webkit-mask-position: 50% 50%;transition:background-color 0.2s ease-in-out;';
                this.div.appendChild(svg);
                this.div.svg = svg;
            } else this.div.style.content = 'url('+path+')';
            return this;
        }

        style(style) {
            applyStyle(style, this);
            return this;
        }
    }

    component.Switch = class Switch extends juice.Item {

        init() {
            this.div.style.cssText += 'color:'+this._color.light+';background-color:'+this._color.dark+';user-select:none;outline:0;-webkit-user-select:none;cursor:pointer;position:relative;text-align:center;';
            this._divOn = document.createElement('div');
            this._divOn.style.cssText = 'width:50%;height:100%;box-sizing:border-box;overflow:hidden;color:'+this._color.dark+';background-color:'+this._color.light+';object-fit:contain;text-align:center;';
            this.div.appendChild(this._divOn)
            this._divOff = document.createElement('div');
            this._divOff.style.cssText = 'width:50%;height:100%;box-sizing:border-box;overflow:hidden;color:'+this._color.dark+';background-color:'+this._color.light+';object-fit:contain;text-align:center;';
            this.div.appendChild(this._divOff)
            this.style('border rect');
            this.transition('slide');
            this._state = 1;
            var self = this;
            this.div.onclick = function(e) {self.toggle();};
            this.state('off');
        }

        toggle() {
            if (this._state == 1) this.state(0);
            else if (this._state == 0) this.state(1);
            this.div.dispatchEvent(new CustomEvent('toggle',{detail:{state:this._state}}));
        }

        text(text) {
            this.textOn(text);
            this.textOff(text);
            return this;
        }

        textOn(text) {
            this._divOn.style.padding = '5px 10px 5px 10px';
            this._divOn.innerHTML = text;
            return this;
        }

        textOff(text) {
            this._divOff.style.padding = '5px 10px 5px 10px';
            this._divOff.innerHTML = text;
            return this;
        }

        bold() {
            this._divOn.style.fontWeight = 'bold';
            this._divOff.style.fontWeight = 'bold';
            return this;
        }

        transition(string) {
            this._transition = string;
            if (this._handle != undefined) {
                this.div.removeChild(this._handle);
                this._handle = undefined;
            }
            this._divOn.style.transition = 'none';
            this._divOff.style.transition = 'none';
            this._divOn.style.cssText += 'transition:none;position:relative;top:;right:;opacity:1;width:50%;background-color:'+this._color.light;
            this._divOff.style.cssText += 'transition:none;position:relative;top:;right:;opacity:1;width:50%;background-color:'+this._color.light;
            if (string == 'push') {
                this._divOn.style.cssText += 'position:absolute;top:0px;right:0px;opacity:1;width:100%;background-color:'+this._color.light+';color:'+this._color.dark;
                this._divOff.style.cssText += 'position:absolute;top:0px;right:0px;opacity:1;width:100%;background-color:'+this._color.dark+';color:'+this._color.light;
                this._divOn.style.transition = 'opacity 0.2s ease-in-out, background-color 0.2s ease-in-out';
                this._divOff.style.transition = 'opacity 0.2s ease-in-out, background-color 0.2s ease-in-out';
            } else if (string == 'flip') {
                this._divOn.style.transition = 'background-color 0.2s ease-in-out';
                this._divOff.style.transition = 'background-color 0.2s ease-in-out';
            } else if (string == 'slide') {
                this._handle = document.createElement('div');
                this._handle.style.cssText = 'left:0px;right:0px;position:absolute;width:50%;height:100%;box-sizing:border-box;overflow:hidden;background-color:'+this._color.dark;
                this.div.appendChild(this._handle)
                this._handle.style.transition = 'left 0.2s ease-in-out, right 0.2s ease-in-out';
            }
            this.style(this._style);
            return this;
        }

        imageOn(path) {
            this._divOn.style.padding = '3px';
            if (path.split('.').pop() == 'svg') {
                var svg = document.createElement('div');
                svg.style = 'width:100%;height:100%;background-color:'+this._color.dark+';-webkit-mask-image:url('+path+');-webkit-mask-size: contain;-webkit-mask-repeat: no-repeat;-webkit-mask-position: 50% 50%;background-color 0.2s ease-in-out;';
                this._divOn.appendChild(svg);
                this._divOn.svg = svg;
            } else this._divOn.style.content = 'url('+path+')';
            return this;
        }

        imageOff(path) {
            this._divOff.style.padding = '3px';
            if (path.split('.').pop() == 'svg') {
                var svg = document.createElement('div');
                svg.style = 'width:100%;height:100%;background-color:'+this._color.light+';-webkit-mask-image:url('+path+');-webkit-mask-size: contain;-webkit-mask-repeat: no-repeat;-webkit-mask-position: 50% 50%;transition:background-color 0.2s ease-in-out;';
                this._divOff.appendChild(svg);
                this._divOff.svg = svg;
            } else this._divOff.style.content = 'url('+path+')';
            return this;
        }

        image(path) {
            this.imageOn(path);
            this.imageOff(path);
            return this;
        }

        style(style) {
            this._style = style;
            function applyStyleToHandle(style, elem) {
                var styles = style.split(' ');
                if (styles.length == 1) {
                    if (style == 'flat') elem._handle.style.cssText += 'border:none;';
                    else if (style == 'border') elem._handle.style.cssText += 'border:2px solid '+elem._color.dark+';';
                    else if (style == 'round') elem._handle.style.cssText += 'border-radius:calc('+elem._height+'/2);';
                    else if (style == 'rounded') elem._handle.style.cssText += 'border-radius:10px;';
                    else if (style == 'rect') elem._handle.style.cssText += 'border-radius:2px;';
                    else if (style == 'shadow') elem._handle.style.cssText += 'box-shadow:0px 0px 3px '+elem._color.dark+';';
                    else if (style == 'none') elem._handle.style.cssText += 'border:none;background-color:none;';
                } else styles.forEach(item => applyStyleToHandle(item, elem));
            }
            if (this._transition == 'slide') applyStyleToHandle(style,this)
            applyStyle(style, this);
            return this;
        }

        state(string) {
            if (this._transition == 'push') {
                if (string == 'on' || string == 1) {
                    this._divOn.style.opacity = 1;
                    this._divOff.style.opacity = 0;
                } else if (string == 'off' || string == 0) {
                    this._divOff.style.opacity = 1;
                    this._divOn.style.opacity = 0;
                }
            } else if (this._transition == 'flip') {
                if (string == 'on' || string == 1) {
                    this._divOn.style.backgroundColor = this._color.dark;
                    this._divOff.style.backgroundColor = this._color.light;
                    if (this._divOn.svg != undefined) this._divOn.svg.style.backgroundColor = this._color.light;
                    if (this._divOff.svg != undefined) this._divOff.svg.style.backgroundColor = this._color.dark;
                } else if (string == 'off' || string == 0) {
                    this._divOff.style.backgroundColor = this._color.dark;
                    this._divOn.style.backgroundColor = this._color.light;
                    if (this._divOn.svg != undefined) this._divOn.svg.style.backgroundColor = this._color.dark;
                    if (this._divOff.svg != undefined) this._divOff.svg.style.backgroundColor = this._color.light;
                }
            } else if (this._transition == 'slide') {
                if (string == 'on' || string == 1) {
                    this._handle.style.left = '50%';
                    this._handle.style.right = '0px';
                } else if (string == 'off' || string == 0) {
                    this._handle.style.right = '50%';
                    this._handle.style.left = '0px';
                }
            }
            this._state = (string == 'on' || string == 1) ? 1 : 0;
            return this;
        }
    }

    component.Multiswitch = class Multiswitch extends component.Switch {
        state(string) {
            if (string == 'on' || string == 1) {
                this._parent._children.forEach(child => {
                    if (child.constructor.name == 'Multiswitch') child.state('off');
                });
            }
            super.state(string);
        }
    }

    component.Image = class Image extends juice.Item {

        init() {
            this.div.style.color = '';
            this.div.style.backgroundColor = '';
            //this.div.style.cssText += 'color:'+this._color.dark+';background-color:'+this._color.light+';';
            this.style('rect');
        }

        source(path) {
            if (path.split('.').pop() == 'svg') {
                var svg = document.createElement('div');
                svg.style = 'width:100%;height:100%;background-color:'+this._color.dark+';-webkit-mask-image:url('+path+');-webkit-mask-size: contain;-webkit-mask-repeat: no-repeat;-webkit-mask-position: 50% 50%;background-color 0.2s ease-in-out;';
                this.div.appendChild(svg);
                this.div.svg = svg;
            } else {
                var _img = document.createElement('img');
                _img.style = 'object-fit:contain;width:100%;height:100%;';
                this.div.appendChild(_img);
                _img.src = path;
            }
            return this;
        }

        /*source(path) {
            //this.div.style.content = 'url('+path+')';
            this._img.src = path;
            return this;
        }*/

        style(style) {
            applyStyle(style, this);
            return this;
        }
    }

    component.Shape = class Shape extends juice.Item {

        init() {
            this.div.style.cssText += 'color:'+this._color.dark+';background-color:'+this._color.normal+';';
            this.style('flat rect');
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

    component.Text = class Text extends juice.Item {

        init() {
            this.div.style.cssText += 'color:'+this._color.text+';background-color:'+this._color.normal+';';
            this.style('flat rect');
        }

        text(text) {
            this.div.innerHTML = text;
            return this;
        }

        fontsize(string) {
            this.div.style.cssText += 'font-size:'+string+';';
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

        align(string) {
            this.div.style.textAlign = string;
            return this;
        }

        style(style) {
            applyStyle(style, this);
            return this;
        }
    }

    component.Progress = class Progress extends juice.Item {

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

    component.Slider = class Slider extends juice.Item {

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

    component.Input = class Input extends juice.Item {

        init() {
            this.div.style.cssText += 'color:'+this._color.dark+';background-color:'+this._color.light+';';
            this._input = document.createElement('input');
            this._input.autocomplete = 'off';
            this._input.style = 'object-fit:contain;width:100%;height:100%;border:none;outline:none;padding-left:10px;padding-bottom:2px;color:'+this._color.text+';background-color:#ffffff;caret-color:'+this._color.dark;
            this.div.appendChild(this._input);
            this.style('border rect');
        }

        text(string) {
            this._input.value = string;
            return this;
        }

        placeholder(string) {
            this._input.placeholder = string;
            return this;
        }

        style(style) {
            applyStyle(style, this);
            return this;
        }

        secret() {
            this._input.type = 'password';
            return this;
        }
    }

    component.Page = class Page extends juice.Item {

        init() {
            this.div.style.cssText += 'color:'+this._color.dark+';background-color:'+this._color.light+';position:relative;overflow:hiiden;';
            this._pages = [];
            this._current_page = false;
            this._transition = 'none';
            this.style('flat rect');
        }

        define(name) {
            var w = super.define(name);
            this._pages.push(w);
            w.div.style.position = 'absolute';
            w.div.style.cssText += 'top:0px;bottom:0px;right:0px;left:0px;position:absolute;display:flex;-webkit-backface-visibility:hidden;';
            if (this._transition == 'fade') w.div.style.transition = 'opacity 0.3s ease-in-out, visibility 0.3s ease-in-out';
            else if (this._transition == 'slide') w.div.style.transition = 'left 0.3s ease-in-out, right 0.3s ease-in-out, visibility 0.3s ease-in-out';
            else if (this._transition == 'flip') w.div.style.transition = 'transform 0.3s ease-in-out';
            else w.div.style.transition = '';
            this.setPage(name);
            return w;
        }

        _hide(widget) {
            var active_transition = (document.readyState === 'interactive' || document.readyState === 'complete')
            if (this._transition == 'fade') {
                //if (active_transition) widget.div.addEventListener('transitionend',function(e){if (this.style.opacity == 0) {this.style.display='none';}},{once:true});
                //else widget.div.style.display = 'none';
                widget.div.style.opacity = 0;
                widget.div.style.visibility = 'hidden';
            } else if (this._transition == 'slide') {
                var idx = this._pages.indexOf(widget);
                var cidx = this._pages.indexOf(this._current_page);
                if (idx < cidx) {
                    //if (active_transition) {
                    //    if (widget.div.style.left == '0px') widget.div.addEventListener('transitionend',function(e){this.style.display='none';},{once:true});
                    //} else if (widget.div.style.left == '0px') widget.div.style.display = 'none';
                    widget.div.style.left = '-150%';
                    widget.div.style.right = '150%';
                } else if (idx > cidx) {
                    //if (active_transition) {
                    //    if (widget.div.style.right == '0px') widget.div.addEventListener('transitionend',function(e){this.style.display='none';},{once:true});
                    //} else if (widget.div.style.right == '0px') widget.div.style.display = 'none';
                    widget.div.style.left = '150%';
                    widget.div.style.right = '-150%';
                }
                widget.div.style.visibility = 'hidden';
            } else if (this._transition == 'flip') widget.div.style.transform = 'rotateX(180deg)';
            else widget.div.style.display = 'none';
        }

        _show(widget) {
            widget.div.style.display = 'flex';
            widget.div.clientWidth; //hack to set display:flex before opacity transition
            if (this._transition == 'fade') {
                widget.div.style.opacity = 1;
                widget.div.style.visibility = 'visible';
            } else if (this._transition == 'slide') {
                var self = this;
                this._pages.forEach(function(item, index, array) {if (item != widget) self._hide(item);});
                widget.div.style.left = '0';
                widget.div.style.right = '0';
                widget.div.style.visibility = 'visible';
            } else if (this._transition == 'flip') widget.div.style.transform = 'rotateX(0deg)';
        }

        transition(string) {
            var self = this;
            this._pages.forEach(function(item, index, array) {item.div.style.transition = 'none';});
            this._pages.forEach(function(item, index, array) {self._show(item);});
            this._transition = string;
            this._pages.forEach(function(item, index, array) {self._hide(item);});
            if (this._current_page) this._show(this._current_page);
            if (string == 'fade') {
                this._pages.forEach(function(item, index, array) {item.div.style.transition = 'opacity 0.3s ease-in-out, visibility 0.3s ease-in-out';});
            } else if (string == 'slide') {
                this._pages.forEach(function(item, index, array) {item.div.style.transition = 'left 0.3s ease-in-out, right 0.3s ease-in-out, visibility 0.3s ease-in-out';});
            } else if (string == 'flip') {
                this._pages.forEach(function(item, index, array) {item.div.style.transition = 'transform 0.3s ease-in-out';});
            } else {
                this._pages.forEach(function(item, index, array) {item.div.style.transition = '';});
            }
            return this;
        }

        setPage(name) {
            var old_page = this._current_page;
            this._current_page = this[name];
            if (old_page) this._hide(old_page);
            this._show(this[name]);
            return this;
        }

        style(style) {
            applyStyle(style, this);
            return this;
        }
    }


}(window.component = window.component || {}));
