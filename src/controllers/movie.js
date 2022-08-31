const { Prisma } = require("@prisma/client");
const { request } = require("express");
const { screening } = require("../utils/prisma");
const prisma = require("../utils/prisma");
const {
  buildRuntimeClause,
  errorMessages,
  buildMovieData,
} = require("./utils");

const getAllMovies = async (req, res) => {
  console.log("Queries: ", req.query);
  const base = { include: { screenings: true } };
  const query = buildRuntimeClause(req.query, base);

  const movies = await prisma.movie.findMany(query);
  res.status(200).json({ movies });
};

const createMovie = async (req, res) => {
  const { title, runtimeMins } = req.body;
  if (!title || !runtimeMins) {
    return res.status(400).json({ error: errorMessages.missingField });
  }

  // const found = await prisma.movie.findUnique({
  //   where: {
  //     title,
  //   },
  // });
  // if (found) {
  //   return res.status(409).json({ error: errorMessages.movieExists });
  // }

  try {
    const movie = await prisma.movie.create({
      data: buildMovieData(req.body),
      include: {
        screenings: true,
      },
    });
    res.status(201).json({ movie });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        return res.status(409).json({ error: errorMessages.movieExists });
      }
    }
    console.log("Error: " + err);
    return res.json({ error: err });
  }
};

const getMovieById = async (req, res) => {
  console.log(req.params);
  let whereClause;
  const id = Number(req.params.id);
  if (id) {
    whereClause = { id };
  } else {
    whereClause = { title: req.params.id };
  }

  const movie = await prisma.movie.findUnique({
    where: whereClause,
    include: {
      screenings: true,
    },
  });
  if (movie) {
    return res.status(200).json({ movie });
  }
  return res.status(404).json({ error: errorMessages.movieNotExists });
};

const updateMovie = async (req, res) => {
  const { title, runtimeMins, screenings } = req.body;
  if (!title || !runtimeMins) {
    return res.status(400).json({ error: errorMessages.missingField });
  }

  try {
    const movie = await prisma.movie.update({
      where: {
        id: Number(req.params.id),
      },
      data: buildMovieData(req.body),
      include: {
        screenings: true,
      },
    });
    res.status(201).json({ movie });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        return res.status(409).json({ error: errorMessages.movieExists });
      } else if (err.code === "P2025") {
        return res.status(404).json({ error: errorMessages.movieNotExists });
      }
    }
    console.log("Error: " + err);
    return res.json({ error: err });
  }
};

module.exports = { getAllMovies, createMovie, getMovieById, updateMovie };
