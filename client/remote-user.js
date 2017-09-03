
AFRAME.registerComponent('remote-controls', {

  schema: {
    owner: {default: 'local'},
    color: {default: '#33a02c'}
  },

  init: function () {
    console.log(this.data);
    var el = this.el;
    var self = this;
    el.addEventListener('model-loaded', function (evt) {
      el.object3D.getObjectByName('sizehint').scale.set(0);
    });

    el.setAttribute('obj-model', {obj: 'assets/models/vive-controller.obj'});
    el.setAttribute('material', {color: self.data.color});

  },

  tick: function(time,delta){}

});

AFRAME.registerComponent('remote-headset', {

  schema: {
    owner: {default: 'local'},
    color: {default: '#33a02c'}
  },

  init: function () {
    console.log(this.data);
    var el = this.el;
    var self = this;
    el.setAttribute('json-model', {src: 'client/remote_head.json'});

    el.addEventListener('model-loaded', function (evt) {
      el.object3DMap.mesh.children[0].material.color = new THREE.Color(self.data.color);
    });

  },

  tick: function(time,delta){}

});
