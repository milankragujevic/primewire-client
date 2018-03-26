let primewire = require('./')
let thewalkingdead_id = 2490619
let thewalkingdead_season = 7
let thewalkingdead_episode = 1
let themazerunner_id = 2808168

let testGetItems = function(callback) {
	primewire.getItems('movies', '', 1, function(success, data) {
		if(!success) {
			return callback(false)
		}
		if(data.length === 24) {
			callback(true)
		} else {
			callback(false)
		}
	})
}

let testGetItem = function(callback) {
	primewire.getItem(themazerunner_id, function(success, data) {
		if(!success) {
			return callback(false)
		}
		if(data.links.length >= 1 && data.type == 'movie' && data.title.length >= 1 && data.year && data.plot) {
			callback(true)
		} else {
			callback(false)
		}
	})
}

let testGetItem2 = function(callback) {
	primewire.getItem(thewalkingdead_id, function(success, data) {
		if(!success) {
			return callback(false)
		}
		if(data.episodes.length >= 1 && data.type == 'tv' && data.title.length >= 1 && data.year && data.plot) {
			callback(true)
		} else {
			callback(false)
		}
	})
}

let testGetEpisode = function(callback) {
	primewire.getEpisodeLinks(thewalkingdead_id, thewalkingdead_season, thewalkingdead_episode, function(success, data) {
		if(!success) {
			return callback(false)
		}
		if(data.links.length >= 1) {
			callback(true)
		} else {
			callback(false)
		}
	})
}

console.log('PRIMEWIRE-CLIENT TEST')
console.log('')
console.log('---')
console.log('')

;(function() {
	let total = 0, passed = 0
	console.log('Testing getItems')
	testGetItems(function(result) {
		total++
		if(result) {
			passed++
			console.error('Test success. ')
		} else {
			console.error('Test failed. ')
		}
		console.log('Testing getItem movie')
		testGetItem(function(result) {
			total++
			if(result) {
				passed++
				console.error('Test success. ')
			} else {
				console.error('Test failed. ')
			}
			console.log('Testing getItem serie')
			testGetItem2(function(result) {
				total++
				if(result) {
					passed++
					console.error('Test success. ')
				} else {
					console.error('Test failed. ')
				}
				console.log('Testing getEpisode')
				testGetItem2(function(result) {
					total++
					if(result) {
						passed++
						console.error('Test success. ')
					} else {
						console.error('Test failed. ')
					}
					console.log('')
					console.log('Testing finished')
					console.log('')
					console.log('---')
					console.log('')
					console.log('Score: ')
					console.log('PASSED: ' + passed)
					console.log('FAILED: ' + (total - passed))
					console.log('TOTAL: ' + total)
				})
			})
		})
	})
})()