juice.def()
    .def('shape')
        .width('100%')
        .height('100%')
        .color('red')
        .def('shape')
            .width('2u')
            .height('2u')
            .color('yellow')
            .center()
        .end()
        .if('width of this > 500px')
            .color('green')
            .def('shape')
                .width('2u')
                .height('2u')
                .color('yellow')
                .center()
            .end()
        .fi()
        .if('width of this > 1000px')
            .color('blue')
            .def('shape')
                .width('2u')
                .height('2u')
                .color('yellow')
                .center()
            .end()
        .fi()
    .end()
.end();
