var data = juice.data({
    color: 'red',
    text: 1
});

var page = 'red';
window.setInterval(()=> {
    page = page == 'red' ? 'blue' : 'red';
    juice.slot['tabs'].rendered_item.toggle(page);
    //juice.slot['page'].rendered_item.data.state = page;
    //juice.slot['page'].rendered_item.setPage(page);
},1000);

juice.def()
    .color('grey')
    .def('shape')
        .color('white')
        .width('10u')
        .height('10u')
        .flow('td')
        .center()
        .pad('5px')
        .def('switch')
            .slot('tabs')
            .width('100%')
            .height('1u')
            .color('bw')
            .hcenter()
            .style('rect border')
            .transition('slide')
            .state('red','red')
            .state('blue','blue')
            .default(page)
        .end()
        .def('pages')
            .slot('page')
            .width('100%')
            .height('-1u')
            .transition('slide')
            .color('grey')
            .link('tabs')
            .page('red')
                .def('shape')
                    .width('50%')
                    .height('50%')
                    .color('red')
                    .center()
                .end()
            .end()
            .page('blue')
                .def('shape')
                    .width('50%')
                    .height('50%')
                    .color('blue')
                    .center()
                .end()
            .end()
        .end()
    .end()
.end();
