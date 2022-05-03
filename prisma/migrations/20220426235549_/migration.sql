-- CreateTable
CREATE TABLE "Vote" (
    "voterId" INTEGER NOT NULL,
    "postId" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    CONSTRAINT "Vote_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Vote_voterId_fkey" FOREIGN KEY ("voterId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Vote_voterId_postId_key" ON "Vote"("voterId", "postId");
