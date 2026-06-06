using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddDoctorLeaveAndSchedule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "id",
                keyValue: 1,
                column: "password",
                value: "AQAAAAIAAYagAAAAEGQtk7e9UUo5gDcH2x8eCy4ZPGJgiEsNm02os9IGVlrsBv6x73FrBD8a9+N2YDPn+A==");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "id",
                keyValue: 2,
                column: "password",
                value: "AQAAAAIAAYagAAAAEAZMkCYvdl5kCQDKjBdPKq2Nk53w+yMOXe31+51DH0fNES+Mudcz8NUNs+6E7DDpuA==");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "id",
                keyValue: 3,
                column: "password",
                value: "AQAAAAIAAYagAAAAEMYr1FHHMBRqDO6CvXlPce5WS2N3UPoCKHcQbh2rLCHSuKCrGCJ5xruudBhlnEJn9g==");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "id",
                keyValue: 4,
                column: "password",
                value: "AQAAAAIAAYagAAAAEOjhk8ytuqkUtAixRkugBso4C9ku8xjvWjK0e5nBJFW4A8rZk/v2yclWZYH7PtnUCg==");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "id",
                keyValue: 5,
                column: "password",
                value: "AQAAAAIAAYagAAAAEB7soW7G4QG3I/3BICSxwYEuPP+8DQ5gP9m2xD6c/h87k2SEbTi9Rj3z4JdoJUB4Mw==");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "id",
                keyValue: 6,
                column: "password",
                value: "AQAAAAIAAYagAAAAEBYB2JmumQLnDbJ0N1l0jX+z7nBAxRd0rCYZhuKUPRnnMOdgw/FmkgYoLD/nmOTvkg==");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "id",
                keyValue: 1,
                column: "password",
                value: "AQAAAAIAAYagAAAAELAFZvJPQGpvaoek0/f55METLf7/+Y6nOpSdGGiU7j7HEmZepOtT5rZWKejxbZm+Jw==");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "id",
                keyValue: 2,
                column: "password",
                value: "AQAAAAIAAYagAAAAEHbZLygNRovzH0dSZDQ+HO9sw+AeOIuXgacT7aH7lPdW3wsWlKc1ge3EJITmKxDN9Q==");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "id",
                keyValue: 3,
                column: "password",
                value: "AQAAAAIAAYagAAAAEEFFRBXeSDvVAQWGrJAl3EvvpYadNMDp8EDTdWTB+lVVjW+Uet71n58CnOvhfy7bcA==");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "id",
                keyValue: 4,
                column: "password",
                value: "AQAAAAIAAYagAAAAECAI8IrKoc07Q5eck+N6pR0hSM/Ltn2v846D+1x2y+eFCALVqC3nKSk1BnbQ9D+ELg==");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "id",
                keyValue: 5,
                column: "password",
                value: "AQAAAAIAAYagAAAAEGUoxMgnNyBOrAd445rivV5wu07MX6e1HzfbSvRd59laihG+Wte5Svc4DZUs8w99Sg==");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "id",
                keyValue: 6,
                column: "password",
                value: "AQAAAAIAAYagAAAAEGOPQj874JfukyUrbEV+mqqxhsBns/6Bpbt7m9UW9TqAxCEMA3IKXS8UOSAmImp7sw==");
        }
    }
}
