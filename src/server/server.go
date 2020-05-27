package main

import (
	"bytes"
	"encoding/base64"
	"net/http"
	"strings"

	"github.com/labstack/echo"
	"github.com/labstack/echo/middleware"
	"github.com/machinebox/sdk-go/facebox"
)

// Server app server.
type Server struct {
	facebox *facebox.Client
	server  *echo.Echo
}

// NewServer init a new Server
func NewServer(facebox *facebox.Client) *Server {
	e := echo.New()
	e.HideBanner = true

	cors := middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"*"},
	})

	e.Use(cors)

	srv := &Server{
		facebox: facebox,
		server:  e,
	}

	srv.server.POST("/webFaceID", srv.handleWebFaceID)
	srv.server.POST("/facebox/teach", srv.handleFaceboxTeach)
	srv.server.Static("/", "/build")

	return srv
}

func (s Server) handleFaceboxTeach(c echo.Context) error {
	img := c.FormValue("imgBase64")
	name := c.FormValue("name")
	id := c.FormValue("id")
	b64data := img[strings.IndexByte(img, ',')+1:]
	imgDec, err := base64.StdEncoding.DecodeString(b64data)
	if err != nil {
		return ResponseError(c, "500-001", "can not decode the image", err)
	}

	err = s.facebox.Teach(bytes.NewReader(imgDec), id, name)
	if err != nil {
		return ResponseError(c, "500-002", "something went wrong teaching", err)
	}

	return c.NoContent(http.StatusOK)
}

func (s Server) handleWebFaceID(c echo.Context) error {
	img := c.FormValue("imgBase64")
	b64data := img[strings.IndexByte(img, ',')+1:]
	imgDec, err := base64.StdEncoding.DecodeString(b64data)
	if err != nil {
		return ResponseError(c, "500-003", "can not decode the image", err)
	}

	faces, err := s.facebox.Check(bytes.NewReader(imgDec))
	if err != nil {
		return ResponseError(c, "500-004", "something went wrong teaching", err)
	}

	var response struct {
		FaceLen int    `json:"faces_len"`
		Matched bool   `json:"matched"`
		Name    string `json:"name"`
	}

	response.FaceLen = len(faces)
	if len(faces) == 1 {
		response.Matched = faces[0].Matched
		response.Name = faces[0].Name
	}

	return c.JSON(http.StatusOK, response)
}
