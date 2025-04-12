export function initialMap(selectCityCallback) {
    let zoomInMap;
    const marker = document.createElement('img');
    marker.src = 'icons_static/marker.svg';
    marker.style.width = '1.8rem';
    marker.style.height = '1.8rem';
    marker.style.transform = 'translate(-50%, -100%)';
    marker.style.position = 'absolute';
  
    const view = new ol.View({
      projection: 'EPSG:4326',
      center: [46.29291789644997, 38.068463912105045],
      zoom: 10,
    });
  
    const overlay = new ol.Overlay({
      element: marker,
      positioning: 'bottom-center',
      stopEvent: false,
    });
  
    const map = new ol.Map({
      target: 'map',
      controls: ol.control.defaults({
        attribution: false,
        zoom: false,
        rotate: false,
      }),
      layers: [
        new ol.layer.Tile({
          source: new ol.source.OSM(),
        }),
      ],
      overlays: [overlay],
      view: view,
    });
  
    const zoomslider = new ol.control.ZoomSlider();
    map.addControl(zoomslider);
  
    map.on('singleclick', function (event) {
      const arrayAddress = event.coordinate;
      overlay.setPosition(arrayAddress);
      clickdMap(arrayAddress);
      selectCityCallback(arrayAddress);
    });
  
    map.on('moveend', function () {
      zoomInMap = view.getZoom();
    });
  
    function clickdMap(arrayCoordinate) {
      view.animate({
        center: arrayCoordinate,
        zoom: zoomInMap < 17 ? zoomInMap + 1.5 : zoomInMap,
      });
    }
  
    return {
      selectLocation: function(address) {
        view.animate({
          center: address,
          zoom: 10,
          duration: 1500,
        });
        overlay.setPosition(address);
      }
    };
  }