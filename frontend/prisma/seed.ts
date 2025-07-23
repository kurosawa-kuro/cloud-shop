/// <reference types="node" />

// /home/wsl/app/fullstack-nextjs/src/lib/prisma.tsx
import { prisma } from '../src/lib/database/prisma';
import { UserStatus, ActionType } from '@prisma/client';

// Unified product list
const productList = [
  // 電化製品
  { id: 1, name: "4Kテレビ 55インチ", price: 89800, category_id: 1 },
  { id: 2, name: "ノートパソコン", price: 128000, category_id: 1 },
  { id: 3, name: "全自動洗濯機", price: 65000, category_id: 1 },
  { id: 4, name: "電子レンジ", price: 23800, category_id: 1 },
  { id: 5, name: "掃除ロボット", price: 45800, category_id: 1 },
  { id: 6, name: "ドライヤー", price: 12800, category_id: 1 },
  { id: 7, name: "コーヒーメーカー", price: 15800, category_id: 1 },
  { id: 8, name: "空気清浄機", price: 34800, category_id: 1 },
  { id: 9, name: "タブレット", price: 45800, category_id: 1 },
  { id: 10, name: "スマートスピーカー", price: 12800, category_id: 1 },
  // 書籍
  { id: 11, name: "プログラミング入門書", price: 2800, category_id: 2 },
  { id: 12, name: "ビジネス戦略の教科書", price: 1600, category_id: 2 },
  { id: 13, name: "人気小説セット", price: 4500, category_id: 2 },
  { id: 14, name: "料理レシピ本", price: 1800, category_id: 2 },
  { id: 15, name: "歴史写真集", price: 3800, category_id: 2 },
  { id: 16, name: "語学学習テキスト", price: 2400, category_id: 2 },
  { id: 17, name: "児童書セット", price: 5600, category_id: 2 },
  { id: 18, name: "経済学の基礎", price: 2200, category_id: 2 },
  { id: 19, name: "健康医学大全", price: 3600, category_id: 2 },
  { id: 20, name: "美術作品集", price: 4800, category_id: 2 },
  // 衣服
  { id: 21, name: "ビジネススーツ", price: 38000, category_id: 3 },
  { id: 22, name: "カジュアルジャケット", price: 15800, category_id: 3 },
  { id: 23, name: "デニムパンツ", price: 8900, category_id: 3 },
  { id: 24, name: "コットンシャツ", price: 4900, category_id: 3 },
  { id: 25, name: "ニットセーター", price: 6800, category_id: 3 },
  { id: 26, name: "スポーツウェア上下", price: 12800, category_id: 3 },
  { id: 27, name: "ダウンジャケット", price: 23800, category_id: 3 },
  { id: 28, name: "レインコート", price: 5800, category_id: 3 },
  { id: 29, name: "パジャマセット", price: 4800, category_id: 3 },
  // 食品
  { id: 30, name: "高級和牛セット", price: 28000, category_id: 4 },
  { id: 31, name: "有機野菜詰め合わせ", price: 4800, category_id: 4 },
  { id: 32, name: "果物セット", price: 5800, category_id: 4 },
  { id: 33, name: "天然魚介類セット", price: 12800, category_id: 4 },
  { id: 34, name: "調味料セット", price: 3800, category_id: 4 },
  { id: 35, name: "お菓子アソート", price: 2800, category_id: 4 },
  { id: 36, name: "健康食品セット", price: 8800, category_id: 4 },
  { id: 37, name: "ドライフルーツ詰め合わせ", price: 3200, category_id: 4 },
  { id: 38, name: "高級茶葉セット", price: 6800, category_id: 4 },
  { id: 39, name: "レトルト食品セット", price: 4200, category_id: 4 },
  { id: 40, name: "オーガニックコーヒー", price: 3600, category_id: 4 },
  // 家具
  { id: 41, name: "ソファーベッド", price: 78000, category_id: 5},
  { id: 42, name: "ダイニングセット", price: 128000, category_id: 5 },
  { id: 43, name: "本棚", price: 45800, category_id: 5 },
  { id: 44, name: "デスク", price: 38000, category_id: 5 },
  { id: 45, name: "クローゼット", price: 52000, category_id: 5 },
  { id: 46, name: "テレビボード", price: 42000, category_id: 5 },
  { id: 47, name: "チェスト", price: 34800, category_id: 5 },
  { id: 48, name: "玄関収納", price: 28000, category_id: 5 },
  { id: 49, name: "サイドテーブル", price: 12800, category_id: 5 },
  { id: 50, name: "シューズラック", price: 8800, category_id: 5 }
];

// Unified category list
const categoryList = [
  { id: 1, name: "電化製品" },
  { id: 2, name: "書籍" },
  { id: 3, name: "衣服" },
  { id: 4, name: "食品" },
  { id: 5, name: "家具" },
];

/**
 * すべてのテーブルのデータを削除する
 * リレーションの依存関係を考慮した順序で削除
 */
async function cleanAllTables() {
  // 依存関係のあるすべてのテーブルを完全に削除
  await prisma.$executeRaw`
    DO $$ 
    BEGIN 
      DELETE FROM "TopPageDisplay";
      DELETE FROM "ReturnItem";
      DELETE FROM "Return";
      DELETE FROM "UserActionLog";
      DELETE FROM "OrderItem";
      DELETE FROM "Order";
      DELETE FROM "CartItem";
      DELETE FROM "ViewHistory";
      DELETE FROM "ProductCategory";
      DELETE FROM "Category";
      DELETE FROM "Product";
      DELETE FROM "UserRole";
      DELETE FROM "Role";
      DELETE FROM "User";
      
      ALTER SEQUENCE "TopPageDisplay_id_seq" RESTART WITH 1;
      ALTER SEQUENCE "ReturnItem_id_seq" RESTART WITH 1;
      ALTER SEQUENCE "Return_id_seq" RESTART WITH 1;
      ALTER SEQUENCE "UserActionLog_id_seq" RESTART WITH 1;
      ALTER SEQUENCE "OrderItem_id_seq" RESTART WITH 1;
      ALTER SEQUENCE "Order_id_seq" RESTART WITH 1;
      ALTER SEQUENCE "CartItem_id_seq" RESTART WITH 1;
      ALTER SEQUENCE "ViewHistory_id_seq" RESTART WITH 1;
      ALTER SEQUENCE "Category_id_seq" RESTART WITH 1;
      ALTER SEQUENCE "Product_id_seq" RESTART WITH 1;
      ALTER SEQUENCE "Role_id_seq" RESTART WITH 1;
    END $$;
  `;
  
  console.log("全テーブルのクリーンアップとシーケンスのリセットが完了しました");
}

async function main() {
  console.log("シードプロセスを開始します...");
  
  try {
    await cleanAllTables();

    // ユーザーの作成
    const users = await Promise.all([
      prisma.user.create({
        data: {
          id: "auth0|user1",
          email: "user1@example.com",
          cognitoId: "cognito|user1",
          emailVerified: true,
          status: UserStatus.ACTIVE
        }
      }),
      prisma.user.create({
        data: {
          id: "auth0|user2",
          email: "user2@example.com",
          cognitoId: "cognito|user2",
          emailVerified: true,
          status: UserStatus.ACTIVE
        }
      }),
      prisma.user.create({
        data: {
          id: "auth0|user3",
          email: "user3@example.com",
          cognitoId: "cognito|user3",
          emailVerified: false,
          status: UserStatus.DELETED
        }
      }),
      prisma.user.create({
        data: {
          id: "auth0|user4",
          email: "user4@example.com",
          cognitoId: "cognito|user4",
          emailVerified: true,
          status: UserStatus.ACTIVE
        }
      }),
      prisma.user.create({
        data: {
          id: "auth0|user5",
          email: "user5@example.com",
          cognitoId: "cognito|user5",
          emailVerified: true,
          status: UserStatus.DISABLED
        }
      })
    ]);

    // ロールの作成
    const roles = await Promise.all([
      prisma.role.create({
        data: { name: "ADMIN" }
      }),
      prisma.role.create({
        data: { name: "USER" }
      }),
      prisma.role.create({
        data: { name: "GUEST" }
      })
    ]);

    // UserRoleの作成
    await Promise.all([
      prisma.userRole.create({
        data: {
          userId: users[0].id,
          roleId: roles[0].id  // ADMIN
        }
      }),
      prisma.userRole.create({
        data: {
          userId: users[1].id,
          roleId: roles[1].id  // USER
        }
      }),
      prisma.userRole.create({
        data: {
          userId: users[2].id,
          roleId: roles[2].id  // GUEST
        }
      }),
      prisma.userRole.create({
        data: {
          userId: users[3].id,
          roleId: roles[1].id  // USER
        }
      }),
      prisma.userRole.create({
        data: {
          userId: users[4].id,
          roleId: roles[1].id  // USER
        }
      })
    ]);

    // カテゴリーの作成
    const createdCategories = await Promise.all(
      categoryList.map(cat =>
        prisma.category.create({
          data: {
            id: cat.id,
            name: cat.name
          }
        })
      )
    );

    // 商品の作成
    const createdProducts = await Promise.all(
      productList.map(prod =>
        prisma.product.create({
          data: {
            id: prod.id,
            name: prod.name,
            price: prod.price,
            rating: 4.0 // default rating value
          }
        })
      )
    );

    // ProductCategoryの作成（各商品に異なるカテゴリーを割り当て）
    await Promise.all(
      productList.map(prod =>
        prisma.productCategory.create({
          data: {
            productId: prod.id,
            categoryId: prod.category_id
          }
        })
      )
    );

    // ViewHistoryの作成
    await Promise.all([
      prisma.viewHistory.create({
        data: {
          userId: users[0].id,
          productId: createdProducts[0].id
        }
      }),
      prisma.viewHistory.create({
        data: {
          userId: users[1].id,
          productId: createdProducts[1].id
        }
      }),
      prisma.viewHistory.create({
        data: {
          userId: users[2].id,
          productId: createdProducts[2].id
        }
      }),
      prisma.viewHistory.create({
        data: {
          userId: users[3].id,
          productId: createdProducts[3].id
        }
      }),
      prisma.viewHistory.create({
        data: {
          userId: users[4].id,
          productId: createdProducts[4].id
        }
      })
    ]);
    

    // UserActionLogの作成を更新
    await Promise.all([
      prisma.userActionLog.create({
        data: {
          userId: users[0].id,
          actionType: ActionType.CART_ADD,
          productId: createdProducts[0].id,
          productName: createdProducts[0].name,
          categoryId: createdCategories[0].id,
          categoryName: createdCategories[0].name,
          cartItemId: 1,
          quantity: 2,
          metadata: { source: "product_page" }
        }
      }),
      prisma.userActionLog.create({
        data: {
          userId: users[1].id,
          actionType: ActionType.ORDER_RETURN_REQUEST,
          productId: createdProducts[1].id,
          metadata: { returnId: 1 }
        }
      }),
      prisma.userActionLog.create({
        data: {
          userId: users[2].id,
          actionType: ActionType.SEARCH_BY_KEYWORD,
          searchKeyword: "スマートフォン",
          metadata: { searchResults: 15 }
        }
      }),
      prisma.userActionLog.create({
        data: {
          userId: users[3].id,
          actionType: ActionType.REVIEW_SUBMIT,
          productId: createdProducts[3].id,
          reviewText: "とても使いやすいです",
          rating: 5.0,
          metadata: { reviewId: 1 }
        }
      }),
      prisma.userActionLog.create({
        data: {
          userId: users[4].id,
          actionType: ActionType.USER_LOGIN,
          metadata: { loginMethod: "email" }
        }
      })
    ]);

    // TopPageDisplayのシード作成（すべてのエントリーに対し、商品情報とカテゴリー情報を必須で設定）
    const topPageDisplays = await Promise.all([
      // SALE display type
      ...Array.from({ length: 4 }, (_, index) => {
        const prodIndex = index % createdProducts.length;
        return prisma.topPageDisplay.create({
          data: {
            displayType: "SALE",
            productId: createdProducts[prodIndex].id,
            productName: createdProducts[prodIndex].name,
            productPrice: createdProducts[prodIndex].price,
            categoryId: createdCategories[prodIndex % createdCategories.length].id,         // Set corresponding category info
            categoryName: createdCategories[prodIndex % createdCategories.length].name,
            priority: index + 1,
            specialPrice: Number((createdProducts[prodIndex].price * 0.9).toFixed(2)),
            startDate: new Date(),
            endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
            isActive: true,
            rating: createdProducts[prodIndex].rating || 4.0  // 商品のratingを使用、なければデフォルト値4.0
          }
        });
      }),
      // RECOMMENDED_CATEGORY display type
      ...Array.from({ length: 4 }, (_, index) => {
        const catIndex = index % createdCategories.length;
        const prodIndex = index % createdProducts.length;
        return prisma.topPageDisplay.create({
          data: {
            displayType: "RECOMMENDED_CATEGORY",
            categoryId: createdCategories[catIndex].id,
            categoryName: createdCategories[catIndex].name,
            productId: createdProducts[prodIndex].id,
            productName: createdProducts[prodIndex].name,
            productPrice: createdProducts[prodIndex].price,
            priority: index + 1,
            startDate: new Date(),
            isActive: true,
            rating: createdProducts[prodIndex].rating || 4.2  // 商品のratingを使用、なければデフォルト値4.2
          }
        });
      }),
      // CONTINUE_SHOPPING display type
      ...Array.from({ length: 4 }, (_, index) => {
        const prodIndex = index % createdProducts.length;
        return prisma.topPageDisplay.create({
          data: {
            displayType: "CONTINUE_SHOPPING",
            productId: createdProducts[prodIndex].id,
            productName: createdProducts[prodIndex].name,
            productPrice: createdProducts[prodIndex].price,
            categoryId: createdCategories[prodIndex % createdCategories.length].id,
            categoryName: createdCategories[prodIndex % createdCategories.length].name,
            priority: index + 1,
            startDate: new Date(),
            isActive: true,
            rating: createdProducts[prodIndex].rating || 4.5  // 商品のratingを使用、なければデフォルト値4.5
          }
        });
      })
    ]);

    console.log("TopPageDisplayのシードデータが作成されました");

    // OrderとOrderItemの作成例
    const order = await prisma.order.create({
      data: {
        userId: users[0].id,
        totalAmount: createdProducts[0].price,
        orderedAt: new Date(),
        orderItems: {
          create: {
            productId: createdProducts[0].id,
            quantity: 1,
            price: createdProducts[0].price
          }
        }
      }
    });

    console.log("シードプロセスが完了しました");
  } catch (error: unknown) {
    console.error('予期せぬエラーが発生しました:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('Seed process failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

