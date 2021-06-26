var state = true;
function animate() {
    juice.slot.responsible.rendered_item.width(state ? '4u' : '8u');
    state = !state;
}
const interval = window.setInterval(()=>{animate();}, 2000);
juice.addEventListener('load', ()=>{animate();})

juice.def()
    .color('grey')
    .def('shape')
        .slot('responsible')
        .width('8u')
        .height('6u')
        .color('blue')
        .center()
        .css('transition:width 2s ease-in-out;')
        .def()
            .width('100%')
            .height('100%')
            .if('this is portrait')
                .color('teal')
                .def('shape')
                    .width('2u')
                    .height('2u')
                    .color('yellow')
                    .center()
                    .def('shape')
                        .width('1u')
                        .height('1u')
                        .color('orange')
                        .center()
                    .end()
                .end()
            .else()
                .color('brown')
                .def('shape')
                    .width('2u')
                    .height('2u')
                    .color('orange')
                    .center()
                    .def('shape')
                        .width('1u')
                        .height('1u')
                        .color('red')
                        .center()
                    .end()
                .end()
            .end()
        .end()
    .end()
.end();
