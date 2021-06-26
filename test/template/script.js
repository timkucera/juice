var data1 = juice.data({
    color: 'red',
    text: 1
});

var data2 = juice.data({
    color: 'blue',
    text: 2
});

juice.template('square')
    .def('shape')
        .width('2u')
        .height('2u')
        .color($template.color)
        .def('text')
            .text($template.text)
            .center()
            .bold()
            .fontsize('verybig')
        .end()
    .end()
.end();

juice.def()
    .color('grey')
    .def('shape')
        .color('black')
        .padgap('1u')
        .wrap()
        .center()
        .square(data1)
        .square(data2)
    .end()
.end();
