
var theme = juice.data({
    color:'red',
});

var color_buttons = juice.data({
    color: ['red','blue','yellow','green','pink'],
    label: (i)=>color_buttons.color[i].toUpperCase(),
});

var style_buttons = juice.data({
    style: ['border','shade','glass','relief','round','colorfill','colortext'],
    label: (i)=>style_buttons.style[i].toUpperCase(),
});

juice.def()
    .def()
        .flow('td')
        .center()
        .gap('10px')
        .def()
            .def('switch')
                .center()
                .width('200px')
                .height('40px')
                .transition('push')
                .state('LIGHT')
                .state('DARK')
                .color('black')
                .style('border')
                .default('LIGHT')
                .bold()
            .end()
        .end()
        .def('shape')
            .center()
            .flow('lr')
            .gap('10px')
            .map(color_buttons)
                .def('button')
                    .width('100px')
                    .height('40px')
                    .bold()
                    .text(color_buttons.label)
                    .color(color_buttons.color)
                .end()
            .end()
        .end()
        .def()
            .flow('lr')
            .gap('10px')
            .map(style_buttons)
                .def('switch')
                    .width('100px')
                    .height('40px')
                    .bold()
                    .state(style_buttons.label)
                    .state()
                    .color('black')
                    //.style(style_buttons.style)
                .end()
            .end()
        .end()
        .def()
            .pad('100px')
            .def('button')
                .center()
                .width('200px')
                .height('40px')
                .color(theme.color)
                .text('Hello World!')
                .bold()
            .end()
        .end()
    .end()
.end()
