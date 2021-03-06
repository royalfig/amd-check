require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

const axios = require("axios");
const cheerio = require("cheerio");
const nodemailer = require("nodemailer");
const mg = require("nodemailer-mailgun-transport");

const mailgunAuth = {
  auth: {
    api_key: process.env.MG,
    domain: "mg.imkant.com",
  },
};

const smtpTransport = nodemailer.createTransport(mg(mailgunAuth));

const mailOptions = {
  from: "amd@mg.imkant.com",
  to: "ryan.feigenbaum@gmail.com",
  subject: "RYAN!!! AMD GPUs are now available",
};

async function scrapeAmd() {
  try {
    const { data } = await axios.get(
      "https://www.amd.com/en/direct-buy/products/us"
    );
    return data;
  } catch (err) {
    console.log(err);
    throw Error(err);
  }
}

function parseHtml(data) {
  const $ = cheerio.load(data);
  const els = $(".views-row");

  const elArr = [];

  $(els).each(function (i, el) {
    const gpu = $(".shop-title", el).text();
    const stock = $(".shop-links", el).text();
    const link =
      "https://www.amd.com/" + $(".shop-full-specs-link > a", el).attr("href");
    const isInStockGpu = /Graphics/.test(gpu) && !/Out of Stock/.test(stock);

    if (isInStockGpu) {
      elArr.push({ gpu, link });
    }
  });

  if (elArr.length) {
    return elArr;
  } else {
    return null;
  }
}

const interval = setInterval(async () => {
  const data = await scrapeAmd();
  const parsed = parseHtml(data);
  if (parsed) {
    const html = `<ul>${parsed.map(
      (el) => "<li>" + el.gpu + "(" + el.link + ")</li>"
    )}</ul>`;
    smtpTransport.sendMail(
      { ...mailOptions, html },
      function (error, response) {
        if (error) {
          console.log(error);
        } else {
          console.log("Successfully sent email.");
          clearInterval(interval);
        }
      }
    );
  }
}, 3000);

app.get("/", async (req, res) => {
  const data = await scrapeAmd();
  const parsed = parseHtml(data);
  res.send(JSON.stringify(parsed));
});

app.listen(port, () => {
  console.log(`Server is running on ${port}`);
});
