// // Пример вызова фунции, за ненадобвностью - удалить
// app.modules.use("app.tasks.getParams").then(function() {
	// 	app.tasks.getParams(2).then( function(res) {
	// 			console.log(res)
	// 		})
// });

if(!app.tasks){app.tasks ={};}
	
app.tasks.getParams = async function(id){
	if(typeof(id)==='number'){
		return (new Promise((resolve,reject) => {
				app.fetch(app.root + "ajax/settings_task_params.php", { id: id, Action: "SELECT" }, "POST")
				.then((result)=>{
					resolve(result[0]);}
				).catch((error) =>{
					reject(error);
				});	
			})
		);

	} else {
		app.error('Bad params');
		return false;
	}
}