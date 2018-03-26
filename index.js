const cheerio = require('cheerio')
const get = require('simple-get')
const mcache = require('memory-cache')
const qs = require('querystring')

let primewire = {}

primewire.userAgent = 'Googlebot/2.1 (+http://www.google.com/bot.html)'
primewire.baseUrl = 'https://primewire.is'
primewire.maxPages = 50

primewire.setBaseUrl = function (baseUrl) {
	this.baseUrl = baseUrl
}

primewire.setUserAgent = function (userAgent) {
	this.userAgent = userAgent;
}

primewire.setMaxPages = function (maxPages) {
	this.maxPages = maxPages;
}

primewire.getItems = function (type, genre, page, callback) {
	let baseUrl = this.baseUrl
	let userAgent = this.userAgent
	let maxPages = this.maxPages
	if(!type) {
		let type = 'movies'
	}
	if(type !== 'tv' && type !== 'movies') {
		throw new Error(`Please provide a valid content type (tv, movies). `)
	}
	if(!page) {
		let page = 1
	}
	if(!genre) {
		let genre = '';
	}
	if(genre === 'all') {
		genre = '';
	}
	if(!callback) {
		throw new Error(`callback argument must be provided`)
	}
	if(typeof callback !== 'function') {
		throw new Error(`callback argument must be a valid callable function`)
	}
	page = parseInt(page)
	if (page < 1 || page > maxPages) {
		throw new Error(`Please provide a page between 1 and ${maxPages}. `)
	}
	let sort = 'featured'
	if(type === 'tv') {
		sort = 'views'
	}
	let url = `${baseUrl}/?sort=${sort}&genre=${genre}&page=${page}`
	if(type === 'tv') {
		url += '&tv=1'
	}
	get.concat({
		url: url,
		headers: {
		  'user-agent': userAgent
		}
	}, (error, statusCode, body) => {
		if (error) {
			return callback(false)
		}
		try {
			$ = cheerio.load(body.toString())
		} catch (e) {
			return callback(false)
		}

		const items = []

		$('.index_item > a').each(function () {
			let title = $(this).attr('title')
			let id = $(this).attr('href')

			id = id.match(/\d+/g)
			id = id ? id[0] : null

			let picture = $(this).find('img').attr('src')
			picture = `https:${picture}`
			
			let year = title.match(/\((\d+)\)/)
			year = year ? +year[1] : null
			
			title = title.slice(6, -7)
			
			items.push({ id, title, year, picture })
		})

		callback(true, items)
	})
}

primewire.getItem = function (id, callback) {
	if(!id) {
		throw new Error(`Please provide id argument`)
	}
	if(!callback) {
		throw new Error(`callback argument must be provided`)
	}
	if(typeof callback !== 'function') {
		throw new Error(`callback argument must be a valid callable function`)
	}
	let baseUrl = this.baseUrl
	let userAgent = this.userAgent
	const url = `${baseUrl}/watch-${id}-X`
	get.concat({
		url: url,
		headers: {
		  'user-agent': userAgent
		}
	}, (error, statusCode, body) => {
		if (error) {
			return callback(false)
		}
		try {
			$ = cheerio.load(body.toString())
		} catch (e) {
			return callback(false)
		}
		
		let item = {}

		let type = 'movie'

		if ($('.tv_show_status').length) {
			type = 'tv'
		}

		const title = $('.movie_navigation h1.titles span a').text().split(' ( ')[0]
		const year = $('.movie_navigation h1.titles span a').text().split(' ( ')[1].replace(' )', '')
		let movieThumb = $('.movie_thumb img').attr('src')
		const poster = `https:${movieThumb}`

		const plotFull = $('.movie_info p').text()
		let plot = plotFull.replace(`${title}: `, '')
		plot = plot.replace('\n', '').trim()

		const warningMessage = $('.warningMessage').text()

		let trailerUrl

		if ($('.movie_info_trailer iframe').length) {
			const trailerData = $('.movie_info_trailer iframe').attr('src')
			let trailerId = trailerData.replace('https://www.youtube.com/embed/', '')
			trailerUrl = `https://www.youtube.com/watch?v=${trailerId}`
		} else {
			trailerUrl = ''
		}

		const imdbID = $('.mlink_imdb a').attr('href').replace('http://www.imdb.com/title/', '').split('/')[0].split('?')[0]

		item.type = type
		item.title = title
		item.year = year
		item.poster = poster
		item.plot = plot
		item.warningMessage = warningMessage
		item.trailerUrl = trailerUrl
		item.imdbID = imdbID

		if (type === 'movie') {
			const links = []

			$('.movie_version').each(function () {
				const label = $(this).find('.version_host script').html()

				/* ignore advertisement links */
				if (/Promo|Sponsor/.test(label)) {
					return
				}

				let url = $(this).find('a[href^="/gohere.php"]').attr('href')
				if (typeof url === 'undefined') { return }
				url = url.slice(url.indexOf('?') + 1)
				url = qs.parse(url).url
				url = Buffer.from(url, 'base64').toString()

				links.push(url)
			})

			item.links = links
		} else {
			const episodes = []

			$('.tv_episode_item a').each(function () {
				const url = $(this).attr('href')
				const season = url.split('season-')[1].split('-')[0]
				const episode = url.split('episode-')[1].split('/')[0].split('?')[0]
				const title = $(this).find('.tv_episode_name').text().replace(' - ', '')
				const aired = $(this).find('.tv_episode_airdate').text().replace(' - ', '')

				if (season === 0 || season >= 100 || episode === 0 || episode >= 100 || /do not link/.test(title)) {
					return
				}

				episodes.push({
					episode,
					season,
					title,
					aired
				})
			})

			item.episodes = episodes
		}

		/* some code here */
		
		callback(true, item)
	})
}

primewire.getEpisodeLinks = function (id, season, episode, callback) {
	if(!id) {
		throw new Error(`Please provide id argument`)
	}
	if(!season) {
		throw new Error(`Please provide season argument`)
	}
	if(!episode) {
		throw new Error(`Please provide episode argument`)
	}
	if(!callback) {
		throw new Error(`callback argument must be provided`)
	}
	if(typeof callback !== 'function') {
		throw new Error(`callback argument must be a valid callable function`)
	}
	
	let baseUrl = this.baseUrl
	let userAgent = this.userAgent
	const url = `${baseUrl}/tv-${id}-X/season-${season}-episode-${episode}`

	get.concat({
		url: url,
		headers: {
			'user-agent': userAgent
		}
	}, (error, statusCode, body) => {
		if (error) {
			return callback(false)
		}
		try {
			$ = cheerio.load(body.toString())
		} catch (e) {
			return callback(false)
		}

		const links = []

		$('.movie_version').each(function () {
			const label = $(this).find('.version_host script').html()

			/* ignore advertisement links */
			if (/Promo|Sponsor/.test(label)) {
				return
			}

			let url = $(this).find('a[href^="/gohere.php"]').attr('href')
			if (typeof url === 'undefined') { return }
			url = url.slice(url.indexOf('?') + 1)
			url = qs.parse(url).url
			url = Buffer.from(url, 'base64').toString()

			links.push(url)
		})
		
		let response = { links: links }

		callback(true, response)
	})
}

module.exports = primewire;