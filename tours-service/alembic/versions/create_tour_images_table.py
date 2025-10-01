"""Create tour_images table and migrate data

Revision ID: create_tour_images_table
Revises: 490a1e813584
Create Date: 2025-09-18 19:45:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid

# revision identifiers, used by Alembic.
revision = 'create_tour_images_table'
down_revision = '490a1e813584'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create tour_images table
    op.create_table('tour_images',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('tour_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tours.id', ondelete='CASCADE'), nullable=False),
        sa.Column('image_url', sa.Text(), nullable=False),
        sa.Column('is_main', sa.Boolean(), nullable=False, default=False),
        sa.Column('display_order', sa.Integer(), nullable=False, default=0),
        sa.Column('alt_text', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    
    # Create indexes
    op.create_index(op.f('ix_tour_images_id'), 'tour_images', ['id'], unique=False)
    op.create_index(op.f('ix_tour_images_tour_id'), 'tour_images', ['tour_id'], unique=False)
    op.create_index(op.f('ix_tour_images_is_main'), 'tour_images', ['is_main'], unique=False)
    op.create_index(op.f('ix_tour_images_display_order'), 'tour_images', ['display_order'], unique=False)


def downgrade() -> None:
    # Drop indexes
    op.drop_index(op.f('ix_tour_images_display_order'), table_name='tour_images')
    op.drop_index(op.f('ix_tour_images_is_main'), table_name='tour_images')
    op.drop_index(op.f('ix_tour_images_tour_id'), table_name='tour_images')
    op.drop_index(op.f('ix_tour_images_id'), table_name='tour_images')
    
    # Drop table
    op.drop_table('tour_images')