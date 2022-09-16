function init(app) {
    app.delete('/delete', handle);
}
function handle(request, response) {

}
module.exports = {
    init: init
}