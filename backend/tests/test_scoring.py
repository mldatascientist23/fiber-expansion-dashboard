"""Tests for the scoring engine."""
import pytest
from datetime import datetime, timedelta
from app.scoring import (
    calculate_scale_points_mdu,
    calculate_scale_points_sfu,
    calculate_fiber_proximity_points,
    calculate_competitor_points,
    calculate_income_points,
    calculate_density_points,
    calculate_erate_points,
    calculate_timing_points,
    determine_tier,
    calculate_score
)
from app.models.models import Property, PropertyType, PropertyStatus, PropertyPhase


class TestScalePoints:
    """Test scale point calculations."""
    
    def test_mdu_large_units(self):
        assert calculate_scale_points_mdu(400) == 100
        assert calculate_scale_points_mdu(500) == 100
    
    def test_mdu_medium_units(self):
        assert calculate_scale_points_mdu(250) == 85
        assert calculate_scale_points_mdu(300) == 85
    
    def test_mdu_small_units(self):
        assert calculate_scale_points_mdu(150) == 70
        assert calculate_scale_points_mdu(75) == 55
        assert calculate_scale_points_mdu(50) == 35
    
    def test_mdu_none_units(self):
        assert calculate_scale_points_mdu(None) == 35
    
    def test_sfu_large_lots(self):
        assert calculate_scale_points_sfu(1000) == 100
        assert calculate_scale_points_sfu(2000) == 100
    
    def test_sfu_medium_lots(self):
        assert calculate_scale_points_sfu(600) == 85
        assert calculate_scale_points_sfu(300) == 70
    
    def test_sfu_small_lots(self):
        assert calculate_scale_points_sfu(150) == 55
        assert calculate_scale_points_sfu(100) == 35
    
    def test_sfu_none_lots(self):
        assert calculate_scale_points_sfu(None) == 35


class TestFiberProximityPoints:
    """Test fiber proximity point calculations."""
    
    def test_very_close(self):
        assert calculate_fiber_proximity_points(0.1) == 100
        assert calculate_fiber_proximity_points(0.25) == 100
    
    def test_close(self):
        assert calculate_fiber_proximity_points(0.3) == 80
        assert calculate_fiber_proximity_points(0.5) == 80
    
    def test_medium_distance(self):
        assert calculate_fiber_proximity_points(0.6) == 60
        assert calculate_fiber_proximity_points(1.0) == 60
    
    def test_far(self):
        assert calculate_fiber_proximity_points(1.5) == 40
        assert calculate_fiber_proximity_points(2.0) == 40
    
    def test_very_far(self):
        assert calculate_fiber_proximity_points(3.0) == 20
    
    def test_none_distance(self):
        assert calculate_fiber_proximity_points(None) == 40


class TestCompetitorPoints:
    """Test competitor point calculations."""
    
    def test_no_competitors(self):
        assert calculate_competitor_points(0) == 100
    
    def test_one_competitor(self):
        assert calculate_competitor_points(1) == 80
    
    def test_two_competitors(self):
        assert calculate_competitor_points(2) == 60
    
    def test_many_competitors(self):
        assert calculate_competitor_points(3) == 30
        assert calculate_competitor_points(5) == 30
    
    def test_none_competitors(self):
        assert calculate_competitor_points(None) == 50


class TestIncomePoints:
    """Test income point calculations."""
    
    def test_high_income(self):
        assert calculate_income_points(120000) == 100
    
    def test_medium_high_income(self):
        assert calculate_income_points(90000) == 80
    
    def test_medium_income(self):
        assert calculate_income_points(70000) == 60
    
    def test_low_medium_income(self):
        assert calculate_income_points(50000) == 40
    
    def test_low_income(self):
        assert calculate_income_points(40000) == 25
    
    def test_none_income(self):
        assert calculate_income_points(None) == 50


class TestDensityPoints:
    """Test density point calculations."""
    
    def test_high_density(self):
        assert calculate_density_points(4000) == 100
    
    def test_medium_high_density(self):
        assert calculate_density_points(2500) == 80
    
    def test_medium_density(self):
        assert calculate_density_points(1500) == 60
    
    def test_low_density(self):
        assert calculate_density_points(800) == 40
    
    def test_very_low_density(self):
        assert calculate_density_points(400) == 25
    
    def test_none_density(self):
        assert calculate_density_points(None) == 50


class TestEratePoints:
    """Test E-Rate anchor point calculations."""
    
    def test_many_anchors(self):
        assert calculate_erate_points(3, 0) == 100
        assert calculate_erate_points(2, 1) == 100
    
    def test_two_anchors(self):
        assert calculate_erate_points(2, 0) == 80
        assert calculate_erate_points(1, 1) == 80
    
    def test_one_anchor(self):
        assert calculate_erate_points(1, 0) == 60
        assert calculate_erate_points(0, 1) == 60
    
    def test_no_anchors(self):
        assert calculate_erate_points(0, 0) == 30


class TestTimingPoints:
    """Test timing point calculations."""
    
    def test_soon(self):
        future = datetime.now() + timedelta(days=90)
        assert calculate_timing_points(future) == 100
    
    def test_medium_term(self):
        future = datetime.now() + timedelta(days=250)
        assert calculate_timing_points(future) == 70
    
    def test_long_term(self):
        future = datetime.now() + timedelta(days=500)
        assert calculate_timing_points(future) == 40
    
    def test_very_long_term(self):
        future = datetime.now() + timedelta(days=800)
        assert calculate_timing_points(future) == 20
    
    def test_none_date(self):
        assert calculate_timing_points(None) == 40


class TestTierDetermination:
    """Test tier determination."""
    
    def test_tier_1(self):
        assert determine_tier(75) == 1
        assert determine_tier(85) == 1
        assert determine_tier(100) == 1
    
    def test_tier_2(self):
        assert determine_tier(50) == 2
        assert determine_tier(65) == 2
        assert determine_tier(74) == 2
    
    def test_tier_3(self):
        assert determine_tier(0) == 3
        assert determine_tier(25) == 3
        assert determine_tier(49) == 3


class TestFullScoreCalculation:
    """Test full score calculation for properties."""
    
    def create_mdu_property(self, **kwargs):
        """Create a test MDU property."""
        defaults = {
            "name": "Test MDU",
            "property_type": PropertyType.MDU,
            "county": "Comal",
            "status": PropertyStatus.PROSPECT,
            "phase": PropertyPhase.PRE_DEVELOPMENT,
            "units": 200,
            "fiber_distance_gvtc": 0.3,
            "competitor_count": 1,
            "median_income": 80000,
            "population_density": 2000,
            "nearby_schools": 2,
            "nearby_libraries": 0
        }
        defaults.update(kwargs)
        prop = Property(**defaults)
        return prop
    
    def create_sfu_property(self, **kwargs):
        """Create a test SFU property."""
        defaults = {
            "name": "Test Subdivision",
            "property_type": PropertyType.SUBDIVISION,
            "county": "Comal",
            "status": PropertyStatus.PROSPECT,
            "phase": PropertyPhase.PRE_DEVELOPMENT,
            "lots": 500,
            "fiber_distance_gvtc": 0.2,
            "competitor_count": 0,
            "median_income": 100000,
            "population_density": 1500,
            "nearby_schools": 3,
            "nearby_libraries": 1
        }
        defaults.update(kwargs)
        prop = Property(**defaults)
        return prop
    
    def test_mdu_score_calculation(self):
        prop = self.create_mdu_property()
        result = calculate_score(prop)
        
        assert "total_score" in result
        assert "tier" in result
        assert "breakdown" in result
        assert 0 <= result["total_score"] <= 100
        assert result["tier"] in [1, 2, 3]
        assert len(result["breakdown"]) > 0
    
    def test_sfu_score_calculation(self):
        prop = self.create_sfu_property()
        result = calculate_score(prop)
        
        assert "total_score" in result
        assert "tier" in result
        assert "breakdown" in result
        assert 0 <= result["total_score"] <= 100
    
    def test_high_score_property(self):
        """Test that good properties get high scores."""
        prop = self.create_mdu_property(
            units=450,
            fiber_distance_gvtc=0.1,
            competitor_count=0,
            median_income=120000,
            population_density=4000,
            nearby_schools=4,
            break_ground_date=datetime.now() + timedelta(days=60)
        )
        result = calculate_score(prop)
        
        assert result["total_score"] >= 70
        assert result["tier"] <= 2
    
    def test_low_score_property(self):
        """Test that poor properties get low scores."""
        prop = self.create_mdu_property(
            units=30,
            fiber_distance_gvtc=3.0,
            competitor_count=5,
            median_income=35000,
            population_density=300,
            nearby_schools=0
        )
        result = calculate_score(prop)
        
        assert result["total_score"] < 50
        assert result["tier"] == 3
    
    def test_score_breakdown_factors(self):
        """Test that score breakdown contains expected factors."""
        prop = self.create_mdu_property()
        result = calculate_score(prop)
        
        factor_names = [b["factor"] for b in result["breakdown"]]
        
        assert "scale" in factor_names
        assert "fiber_proximity" in factor_names
        assert "competitors" in factor_names
        assert "income" in factor_names
        assert "density" in factor_names
        assert "erate_anchors" in factor_names
        assert "timing" in factor_names


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
