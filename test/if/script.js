
var data = juice.data({
    value: true
});

window.setInterval(()=>data.value = data.value == false, 500);

juice.def()
    .color('black')
    .def('shape')
        .width('100%')
        .height('100%')
        .color('blue')
        .def('shape')
            .width('2u')
            .height('2u')
            .center()
            .if('data.value == true')
                .color('yellow')
            .else()
                .color('orange')
            .end()
            .def('shape')
                .width('1u')
                .height('1u')
                .if('data.value==true')
                    .color('red') // doesnt work without else?
                .end()
                .center() // center after if not rendered?
            .end()
        .end()
    .end()
.end();
