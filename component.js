(function(component, undefined) {

    component.Button = class Button extends juice.Item {

        init() {
            //TODO: change to dynamic gridsize and color
            this.div.style.cssText += 'justify-content:center;align-items:center;cursor:pointer;user-select:none;outline:0;-webkit-user-select:none;text-align:center;word-wrap:break-word;';
            this.div.addEventListener('mouseover',function() {this.style.backgroundColor = 'var(--item-color-background-tint1)'});
            this.div.addEventListener('mouseleave',function() {this.style.backgroundColor = 'var(--item-color-background)'});
            this.style();
        }

        text(text) {
            this.div.style.padding = '5px 10px 5px 10px';
            this.div.innerHTML = text;
            return this;
        }

        bold(string) {
            this.div.style.fontWeight = 'bold';
            return this;
        }

        image(path) {
            this.div.style.padding = '3px';
            if (path.split('.').pop() == 'svg') {
                if (this.div.svg) this.div.removeChild(this.div.svg);
                var svg = document.createElement('div');
                svg.style = 'width:100%;height:100%;background-color:var(--foreground-color);-webkit-mask-image:url('+path+');-webkit-mask-size: contain;-webkit-mask-repeat: no-repeat;-webkit-mask-position: 50% 50%;transition:background-color 0.2s ease-in-out;';
                this.div.appendChild(svg);
                this.div.svg = svg;
            } else this.div.style.content = 'url('+path+')';
            return this;
        }
    }

    component.Switch = class Switch extends juice.Item {

        init() {
            this.div.style.cssText += 'position:relative;user-select:none;';

            this.container = document.createElement('div');
            this.container.style.cssText = 'display:grid;height:100%;width:100%;';
            this.div.appendChild(this.container);

            this.handle = document.createElement('div');
            this.handle.style.cssText = 'z-index:1;position:absolute;overflow:hidden;transition:all 0.2s ease-in-out;pointer-events:none;height:100%;display:none;';
            this.div.appendChild(this.handle);

            this.handleContainer = document.createElement('div');
            this.handleContainer.style.cssText = 'position:relative;display:grid;transition:left 0.2s ease-in-out;';
            this.handle.appendChild(this.handleContainer);

            this.states = {};
            this.data.state = undefined;
            this._offstate = false;
            this._state = undefined;
            this.isBold = false;
            this._transition = 'push';

            this.style();

            this.data.$addEventListener('change:state', this._updateFromData, this);
        }

        _updateFromData() {
            if (this._state) this.setState(this._state, false);
            this.setState(this.data.state, true);
            this._state = this.data.state;
        }

        width(string) {
            super.width(string);
            this._fixWidth();
            return this;
        }

        _fixWidth(string) {
            const computed = getComputedStyle(this.div);
            const borderLeft = parseFloat(computed.borderLeftWidth);
            const borderWidth = borderLeft + parseFloat(computed.borderRightWidth);
            this.handleContainer.style.minWidth = this.container.clientWidth-borderWidth/2+'px';
        }

        height(string) {
            super.height(string);
            this._fixHeight();
            return this;
        }

        _fixHeight(string) {
            const computed = getComputedStyle(this.div);
            const borderTop = parseFloat(computed.borderTopWidth);
            const borderHeight = borderTop + parseFloat(computed.borderBottomWidth);
            this.handleContainer.style.minHeight = this.container.clientHeight-borderHeight/2+'px';
        }

        state(name,label) { // TODO: different on/off labels
            if (name == undefined) {
                this._offstate = true;
                return this;
            }
            if (label === undefined) label = name;
            var state = document.createElement('div');
            state.style.cssText = 'color:var(--foreground-color);background-color:var(--background-color);cursor:pointer;transition:all 0.2s ease-in-out;display:flex;justify-content:center;align-items:center;padding:5px';
            state.addEventListener('mouseover',()=>this.style.filter = 'brightness(150%)');
            state.addEventListener('mouseleave',()=>this.style.filter = 'none');
            var self = this;
            state.addEventListener('click',()=>self.toggle(name));

            var content = document.createElement('div');
            if (['svg','png','jpeg','jpg','gif','webp','apng','avif'].includes(label.split('.').pop())) {
                if (label.split('.').pop() == 'svg') {
                    content.style.cssText = 'width:80%;height:80%;background-color:var(--foreground-color);-webkit-mask-image:url('+label+');-webkit-mask-size: contain;-webkit-mask-repeat: no-repeat;-webkit-mask-position: 50% 50%;';
                } else content.style.content = 'url('+label+')';
                state.type = 'image';
            } else {
                content.innerHTML = label;
                content.style.color = 'var(--background-color)';
                if (this.isBold) content.style.fontWeight = 'bold';
                state.type = 'text';
            }
            content.style.transition = 'all 0.2s ease-in-out';
            state.content = content;
            state.appendChild(content);

            var num_states = Object.keys(this.states).length;
            this.container.style.gridTemplateColumns = ' auto'.repeat(num_states+1);
            this.handleContainer.style.gridTemplateColumns = ' auto'.repeat(num_states+1);
            state.style.gridColumnStart = num_states+1;
            var handle_clone = state.cloneNode(true);
            handle_clone.style.backgroundColor = 'var(--foreground-color)';
            if (state.type == 'image') handle_clone.childNodes[0].style.backgroundColor = 'var(--background-color)';
            if (state.type == 'text') handle_clone.childNodes[0].style.color = 'var(--background-color)';
            this.handleContainer.appendChild(handle_clone);
            this.container.appendChild(state);
            this.states[name] = state;
            return this;
        }

        default(name) {
            this.toggle(name);
            return this;
        }

        toggle(name) {
            if (this._state == name) {
                if (this._offstate) {
                    this.setState(name, false);
                    this._state = undefined;
                    this.data.state = undefined;
                } else if (Object.keys(this.states).length == 2) {
                    var otherState = Object.keys(this.states)[0] == name ? Object.keys(this.states)[1] : Object.keys(this.states)[0];
                    this.toggle(otherState);
                }
            } else {
                if (this._state) this.setState(this._state, false);
                this.setState(name, true);
                this._state = name;
                this.data.state = name;
            }
        }

        setState(name,state) {
            if (this._transition == 'push') {
                var backgroundColor = state ? 'var(--foreground-color)' : 'var(--background-color)';
                var foregroundColor = state ? 'var(--background-color)' : 'var(--foreground-color)';
                this.states[name].style.backgroundColor = backgroundColor;
                if (this.states[name].type == 'image') this.states[name].content.style.backgroundColor = foregroundColor;
                if (this.states[name].type == 'text') this.states[name].content.style.color = foregroundColor;
            } else if (this._transition == 'slide') {
                if (state == true) {
                    this.handle.style.left = this.states[name].offsetLeft+'px';
                    this.handle.style.width = this.states[name].getBoundingClientRect().width+'px';
                    this.handleContainer.style.left = -this.states[name].offsetLeft+'px';
                }
            }
        }

        bold(string) {
            Object.keys(this.states).forEach(name => this.states[name].content.style.fontWeight = 'bold');
            this.isBold = true;
            return this;
        }

        transition(string) {
            var transitions = string.split(' ');
            var self = this;
            function setTransition(t) {
                if (t == 'push') {
                    self.handle.style.display = 'none';
                    self._transition = t;
                } else if (t == 'slide') {
                    self.handle.style.display = 'flex';
                    self._transition = t;
                } else if (t == 'underline') self.handle.style.cssText += 'height:3px;bottom:0px;'
            }
            transitions.forEach(transition => setTransition(transition));
            return this;
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
                svg.style = 'width:100%;height:100%;background-color:var(--background-color);-webkit-mask-image:url('+path+');-webkit-mask-size: contain;-webkit-mask-repeat: no-repeat;-webkit-mask-position: 50% 50%;background-color 0.2s ease-in-out;';
                this.div.appendChild(svg);
                this.div.svg = svg;
            } else {
                this._img = document.createElement('img');
                this._img.style = 'object-fit:contain;width:100%;height:100%;';
                this.div.appendChild(_img);
                this._img.src = path;
            }
            return this;
        }

        /*source(path) {
            //this.div.style.content = 'url('+path+')';
            this._img.src = path;
            return this;
        }*/
    }

    component.Shape = class Shape extends juice.Item {

        init() {

        }

        shape(string) {
            // TODO: implement
            return this;
        }

    }

    component.Text = class Text extends juice.Item {

        init() {
            this.div.style.cssText += '';
            this.div.style.cssText += 'color:var(--foreground-color);'
        }

        text(text) {
            this.div.innerHTML = text;
            return this;
        }

        fontsize(string) {
            this.div.style.cssText += 'font-size:'+this._parse_font_size(string)+';';
            return this;
        }

        bold(string) {
            var weight = '900';
            this.div.style.cssText += 'font-weight:'+weight+';';
            return this;
        }

        italic() {
            var style = 'italic';
            this.div.style.cssText += 'font-style:'+style+';';
            return this;
        }

        underline() {
            var style = 'underline';
            this.div.style.cssText += 'text-decoration:'+style+';';
            return this;
        }

        align(string) {
            this.div.style.textAlign = string;
            return this;
        }
    }

    component.Progress = class Progress extends juice.Item {

        init() {
            this.div.style.cssText += 'display:flex;overflow:hidden;';
            this._progress = document.createElement('div');
            this._progress.style.cssText = 'height:100%;';
            this.div.appendChild(this._progress);
            this._direction = 'horizontal';
            this.style();
        }

        default(value) {
            this.value = value;
            this._default = value;
            return this;
        }

        vertical() {
            this._direction = 'vertical';
            this._progress.style.cssText += 'width:100%;height:;';
            this.div.style.cssText += 'flex-direction:column-reverse;';
            this.value = this._value;
            return this;
        }

        horizontal() {
            this._direction = 'horizontal';
            this._progress.style.cssText += 'height:100%;width:;';
            this.div.style.cssText += 'flex-direction:row;';
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

    }

    component.Slider = class Slider extends juice.Item {

        init() {
            this._slider = document.createElement('input');
            this._slider.type = 'range';
            this._slider.style.cssText = 'width:100%;height:5px;outline:none;';
            this._slider.classList.add('juiceSlider');
            this._slider.style.setProperty('--handle-color', 'var(--foreground-color)');
            this._slider.style.setProperty('--handle-border-color', 'var(--background-color)');
            this.div.appendChild(this._slider);
            this.min(1);
            this.max(100);
            this.default(1);
            this.style();
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
            this.div.style.cssText += '';
            this._input = document.createElement('input');
            this._input.autocomplete = 'off';
            this._input.style = 'object-fit:contain;width:100%;height:100%;border:none;outline:none;padding-left:10px;padding-bottom:2px;color:var(--background-color);background-color:#ffffff;caret-color:var(--background-color);';
            this.div.appendChild(this._input);
            this.style();
        }

        text(string) {
            this._input.value = string;
            return this;
        }

        placeholder(string) {
            this._input.placeholder = string;
            return this;
        }

        secret() {
            this._input.type = 'password';
            return this;
        }
    }

    component.Page = class extends juice.Item {
        init() {
            this.div.style.cssText += 'position:relative;top:0px;bottom:0px;right:0px;left:0px;position:absolute;display:flex;-webkit-backface-visibility:hidden;';
            this.transition = this.node.scope.dom.rendered_item._transition;
            this.setTransition(this.transition );
        }

        transition(string, show=false) {
            item.div.style.transition = 'none';
            this.show();
            this.transition = string;
            if (!show) this.hide();
            this.setTransition(string);
        }

        setTransition(string) {
            if (string == 'fade') this.div.style.transition = 'opacity 0.3s ease-in-out, visibility 0.3s ease-in-out';
            else if (string == 'slide') this.div.style.transition = 'left 0.3s ease-in-out, right 0.3s ease-in-out, visibility 0.3s ease-in-out';
            else if (string == 'flip') this.div.style.transition = 'transform 0.3s ease-in-out';
            else this.div.style.transition = '';
        }

        show() {
            this.div.style.display = 'flex';
            this.div.clientWidth; //hack to set display:flex before opacity transition
            if (this.transition == 'fade') {
                this.div.style.opacity = 1;
                this.div.style.visibility = 'visible';
            } else if (this.transition == 'slide') {
                this.div.style.left = '0';
                this.div.style.right = '0';
                this.div.style.visibility = 'visible';
            } else if (this.transition == 'flip') this.div.style.transform = 'rotateY(0deg)';
        }

        hide(direction) {
            if (this.transition == 'fade') {
                this.div.style.opacity = 0;
                this.div.style.visibility = 'hidden';
            } else if (this.transition == 'slide') {
                this.div.style.left = (direction == 'right') ? '-150%' : '150%';
                this.div.style.right = (direction == 'right') ? '150%' : '-150%';
                this.div.style.visibility = 'hidden';
            } else if (this.transition == 'flip') this.div.style.transform = 'rotateY(180deg)';
            else this.div.style.display = 'none';
        }

    }

    component.Pages = class extends juice.Item {

        init() {
            this.div.style.cssText += 'position:relative;overflow:hidden;';
            this._pages = {};
            this._page_order = [];
            this._current_page = false;
            this._transition = 'none';
            this.data.$addEventListener('change:state', this._updateFromData, this);
        }

        _updateFromData() {
            this.setPage(this.data.state);
        }

        _hide(name) {
            for (var item of this._page_order) {
                if (item == name) var direction = 'left';
                if (item == this._current_page) var direction = 'right';
                if (direction) break;
            }
            this._pages[name].hide(direction);
        }

        _show(name) {
            if (this._transition == 'slide') Object.entries(this._pages).forEach((k,v)=> {
                if (k != name) this._hide(name);
            });
            this._pages[name].show();
        }

        transition(string) {
            Object.entries(this._pages).forEach((k,v) => {
                this._pages[k].transition(string, (this._current_page == k));
            });
            this._transition = string;
            return this;
        }

        setPage(name) {
            var old_page = this._current_page;
            this._current_page = name;
            if (old_page) this._hide(old_page);
            this._show(name);
            this.data.state = this._current_page;
            return this;
        }

    }


}(window.component = window.component || {}));
