package main

import (
	"strconv"
	"strings"

	"github.com/labstack/echo"
)

// Response contains custom status code, message and data
type Response struct {
	Code    string      `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data"`
}

// ResponseError renders JSON response for error
func ResponseError(c echo.Context, code string, message string, err error) error {
	c.JSON(parseHTTPStatus(code), Response{Code: code, Message: message})
	return err
}

// parseHTTPStatus
func parseHTTPStatus(code string) (httpStatus int) {
	httpStatus = 500
	codeSegments := strings.Split(code, "-")
	if len(codeSegments) != 2 {
		return
	}

	_httpStatus, err := strconv.Atoi(codeSegments[0])
	if err != nil {
		return
	}

	httpStatus = _httpStatus
	return
}
