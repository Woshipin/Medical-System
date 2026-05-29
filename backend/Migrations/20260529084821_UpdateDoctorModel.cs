using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class UpdateDoctorModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "date_of_birth",
                table: "Doctors");

            migrationBuilder.AddColumn<int>(
                name: "status",
                table: "Doctors",
                type: "int",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "id",
                keyValue: 1,
                column: "password",
                value: "AQAAAAIAAYagAAAAEDGOl9LTVGZoUoGzoCz1REbJH5ILZ5G+B+lcHOFa2bqX/13YqUEVVJpVbITOfhEWuQ==");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "id",
                keyValue: 2,
                column: "password",
                value: "AQAAAAIAAYagAAAAENFvbbPv0ErdQLa7Seo//pzKl+c8io+6sgJN0zCQ/SU0xmBoNn8qXGb0MNEycIs9Xg==");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "id",
                keyValue: 3,
                column: "password",
                value: "AQAAAAIAAYagAAAAEJfFN+a0HyLaDtz7FSaQCln++KEA8a1ogSdq47qveopIK5C3EC3POQBljQNONNcQzw==");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "id",
                keyValue: 4,
                column: "password",
                value: "AQAAAAIAAYagAAAAECKBntNc0fMu9kyqCrob3H0Ca2QN9kJiiIUxzClJwxbsw1BD5oSC9NPVhAp5l0ndZw==");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "id",
                keyValue: 5,
                column: "password",
                value: "AQAAAAIAAYagAAAAEOg+cnziLqmqwT4pN/uUD9eKTRqsgms7EIaZ41304Xe2DhtB0SZACCCa/XZVKYYsbQ==");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "status",
                table: "Doctors");

            migrationBuilder.AddColumn<DateOnly>(
                name: "date_of_birth",
                table: "Doctors",
                type: "date",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "id",
                keyValue: 1,
                column: "password",
                value: "AQAAAAIAAYagAAAAEEWLbvdseo4fz63/khpVIRkh1jZngBL/pDiTcLndoUOyDGoWPqtj0yedEEuSlM8Xfw==");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "id",
                keyValue: 2,
                column: "password",
                value: "AQAAAAIAAYagAAAAEKAhfqhAKxM2heaHkFEYOIrgldAG8gCb6QJ5RLNXmCJLgtg++zuUFRN9ihD8D6RA0A==");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "id",
                keyValue: 3,
                column: "password",
                value: "AQAAAAIAAYagAAAAEJfY2dITUsmciwN6dApeIPa0H+HOJKSP66OpL7bbc2FR1VdQ4ZfNIu5lE2JibV0i9Q==");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "id",
                keyValue: 4,
                column: "password",
                value: "AQAAAAIAAYagAAAAEKcukAqy12g0sSNQH6TYTzUvq5QQ6EYHq7B1vuitgC011YUOBZlLlkYO7VNXrZ99KA==");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "id",
                keyValue: 5,
                column: "password",
                value: "AQAAAAIAAYagAAAAEDvhWtz4XCrTjSUe7rwtMOX49LNNjskipNx2fnlH0uHcSGN+8D2TWmN6/Rn4Zjyfbw==");
        }
    }
}
