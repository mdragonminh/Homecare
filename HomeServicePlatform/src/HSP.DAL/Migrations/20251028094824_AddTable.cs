using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HSP.DAL.Migrations
{
    /// <inheritdoc />
    public partial class AddTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Tạo bảng ChatMessageHistories
            migrationBuilder.CreateTable(
                name: "ChatMessageHistories",
                columns: table => new
                {
                    // Từ BaseEntity<Guid>
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),

                    // Các thuộc tính riêng
                    ConversationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CustomerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Role = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Content = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ToolCallId = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    FunctionName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    FunctionArguments = table.Column<string>(type: "nvarchar(max)", nullable: true),

                    // Từ IDateTracking
                    DateCreated = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DateModified = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatMessageHistories", x => x.Id);
                });

            // Thêm Index (chỉ mục) để tăng tốc độ truy vấn theo ConversationId và CustomerId
            migrationBuilder.CreateIndex(
                name: "IX_ChatMessageHistories_ConversationId",
                table: "ChatMessageHistories",
                column: "ConversationId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatMessageHistories_CustomerId",
                table: "ChatMessageHistories",
                column: "CustomerId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Xóa bảng nếu migration bị revert
            migrationBuilder.DropTable(
                name: "ChatMessageHistories");
        }
    }
}