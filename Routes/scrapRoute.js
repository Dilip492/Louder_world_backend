const express = require("express")
const puppeteer = require("puppeteer");
require('dotenv').config();

const router = express.Router();

router.get('/getEvents/:county/:city', async (req, res) => {


    const Country = req.params.county;
    const city = req.params.city;
    try {

        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        const url = `https://www.eventbrite.com.au/d/${Country}--${city}/events/`;

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        await page.setRequestInterception(true);
        page.on('request', (request) => {
            const resourceType = request.resourceType();
            if (['image', 'stylesheet', 'font', 'media',].includes(resourceType)) {
                request.abort();
            } else {
                request.continue();
            }
        })
        await page.waitForSelector('section.discover-vertical-event-card');


        const eventList = await page.evaluate(() => {
            const cards = document.querySelectorAll('section.discover-vertical-event-card');

            const events = [];

            cards.forEach(card => {
                const title = card.querySelector('h3')?.textContent.trim() || '';
                const update = card.querySelector(".DiscoverVerticalEventCard-module__urgencySignals___7QVRD")?.textContent.trim() || '';
                const date = card.querySelector('p:nth-of-type(1)')?.textContent.trim() || '';
                const location = card.querySelector('p:nth-of-type(2)')?.textContent.trim() || '';
                const price = card.querySelector('.DiscoverVerticalEventCard-module__priceWrapper___usWo6 p')?.textContent.trim() || '';
                const link = card.querySelector('a.event-card-link')?.href || '';
                const image = card.querySelector('img.event-card-image')?.src || '';

                events.push({ title, date, location, price, link, image, update });
            });

            return events;
        });


        await browser.close();



        if (eventList == null) {
            return res.status(400).json({ message: "Events list not found " })
        }


        res.status(200).json({ data: eventList })


    } catch (error) {

        console.error(error.message);
        res.status(500).json({ message: "error fetching events", error: error.message })

    }




})



module.exports = router;